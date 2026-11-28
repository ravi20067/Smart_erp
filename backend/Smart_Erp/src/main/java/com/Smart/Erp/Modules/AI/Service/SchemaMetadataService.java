package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.Config.AiQueryProperties;
import com.Smart.Erp.Modules.AI.Metadata.ColumnMetadata;
import com.Smart.Erp.Modules.AI.Metadata.DatabaseSchemaMetadata;
import com.Smart.Erp.Modules.AI.Metadata.RelationshipMetadata;
import com.Smart.Erp.Modules.AI.Metadata.TableMetadata;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Discovers MySQL schema metadata from INFORMATION_SCHEMA, caches it with TTL and
 * signature change detection, filters sensitive columns, and selects relevant
 * authorized tables for a user's question.
 */
@Slf4j
@Service
public class SchemaMetadataService {

    private static final Set<String> SENSITIVE_COLUMN_KEYWORDS = Set.of(
            "password", "secret", "token", "private_key", "public_key",
            "encrypted_embedding", "api_key", "refresh_token", "salt", "client_ip"
    );

    private static final Map<String, List<String>> DOMAIN_KEYWORDS = Map.ofEntries(
            Map.entry("attendance", List.of("student_attendances", "attendance_sessions", "students", "subjects", "sections", "teachers")),
            Map.entry("present", List.of("student_attendances", "attendance_sessions", "students", "subjects")),
            Map.entry("absent", List.of("student_attendances", "attendance_sessions", "students", "subjects")),
            Map.entry("उपस्थित", List.of("student_attendances", "attendance_sessions", "students", "subjects")),
            Map.entry("हाजिरी", List.of("student_attendances", "attendance_sessions", "students", "subjects")),
            Map.entry("subject", List.of("subjects", "courses", "teacher_enrollment", "subject_teacher_enrollments", "teachers", "student_enrollment")),
            Map.entry("teach", List.of("teachers", "teacher_enrollment", "subject_teacher_enrollments", "subjects", "courses", "section_timetable_entries")),
            Map.entry("course", List.of("courses", "departments", "schools", "subjects", "sections", "student_enrollment")),
            Map.entry("section", List.of("sections", "sectionGroup", "courses", "student_enrollment", "students")),
            Map.entry("student", List.of("students", "student_enrollment", "users", "basic_details", "sections", "sectionGroup", "courses")),
            Map.entry("assignment", List.of("assignments", "chapters", "subjects", "academic_years", "teachers")),
            Map.entry("exam", List.of("exams", "exam_results", "subjects", "student_enrollment", "students")),
            Map.entry("marks", List.of("exams", "exam_results", "subjects", "student_enrollment", "students")),
            Map.entry("result", List.of("exams", "exam_results", "subjects", "student_enrollment", "students")),
            Map.entry("performance", List.of("exams", "exam_results", "student_attendances", "subjects", "student_enrollment", "students")),
            Map.entry("report", List.of("exams", "exam_results", "student_attendances", "attendance_sessions", "subjects", "students", "student_enrollment")),
            Map.entry("timetable", List.of("section_timetable_versions", "section_timetable_entries", "base_time_table_periods", "subjects", "rooms", "sections")),
            Map.entry("schedule", List.of("section_timetable_versions", "section_timetable_entries", "base_time_table_periods", "subjects", "rooms")),
            Map.entry("fee", List.of("student_fee_accounts", "fee_payments", "fee_structures", "fee_components", "scholarships", "students", "student_enrollment")),
            Map.entry("payment", List.of("fee_payments", "student_fee_accounts", "students", "student_enrollment")),
            Map.entry("library", List.of("books", "book_issues", "students")),
            Map.entry("book", List.of("books", "book_issues", "students"))
    );

    private final JdbcTemplate jdbcTemplate;
    private final AiQueryProperties properties;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private volatile DatabaseSchemaMetadata cachedSchema;

    public SchemaMetadataService(
            @Qualifier("aiReadOnlyJdbcTemplate") JdbcTemplate jdbcTemplate,
            AiQueryProperties properties
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.properties = properties;
    }

    public DatabaseSchemaMetadata getSchemaMetadata() {
        DatabaseSchemaMetadata current = cachedSchema;
        if (current != null && !isExpired(current)) {
            return current;
        }

        lock.writeLock().lock();
        try {
            if (cachedSchema != null && !isExpired(cachedSchema)) {
                return cachedSchema;
            }
            cachedSchema = discoverSchema();
            return cachedSchema;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public DatabaseSchemaMetadata refreshSchemaMetadata() {
        lock.writeLock().lock();
        try {
            DatabaseSchemaMetadata fresh = discoverSchema();
            if (cachedSchema != null && !Objects.equals(cachedSchema.getSchemaSignature(), fresh.getSchemaSignature())) {
                log.info("Detected database schema change. Signature updated from {} to {}",
                        cachedSchema.getSchemaSignature(), fresh.getSchemaSignature());
            }
            cachedSchema = fresh;
            return cachedSchema;
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * Selects relevant tables from the cached schema that are also in the user's allowedTables.
     */
    public List<TableMetadata> selectRelevantAuthorizedTables(String question, Set<String> allowedTables) {
        DatabaseSchemaMetadata schema = getSchemaMetadata();
        if (schema.getTables().isEmpty() || allowedTables == null || allowedTables.isEmpty()) {
            return List.of();
        }

        String lowerQuestion = question == null ? "" : question.toLowerCase(Locale.ROOT);
        Set<String> candidateNames = new LinkedHashSet<>();

        for (Map.Entry<String, List<String>> entry : DOMAIN_KEYWORDS.entrySet()) {
            if (lowerQuestion.contains(entry.getKey())) {
                candidateNames.addAll(entry.getValue());
            }
        }

        // Always include core identity/lookup tables if allowed
        candidateNames.addAll(List.of("users", "basic_details", "academic_years", "students", "teachers", "subjects", "courses", "sections", "sectionGroup"));

        // Match any table name directly mentioned in the question
        for (String tableName : schema.getTables().keySet()) {
            if (lowerQuestion.contains(tableName.toLowerCase(Locale.ROOT))) {
                candidateNames.add(tableName);
            }
        }

        List<TableMetadata> selected = new ArrayList<>();
        for (String candidate : candidateNames) {
            TableMetadata table = findTableCaseInsensitive(schema, candidate);
            if (table != null && isTableAllowed(table.getTableName(), allowedTables)) {
                selected.add(table);
            }
        }

        // If very few matched, include remaining allowed tables up to a reasonable prompt budget
        if (selected.size() < 5) {
            for (TableMetadata table : schema.getTables().values()) {
                if (isTableAllowed(table.getTableName(), allowedTables) && !selected.contains(table)) {
                    selected.add(table);
                    if (selected.size() >= 15) {
                        break;
                    }
                }
            }
        }

        return selected;
    }

    /**
     * Formats authorized tables and their non-sensitive columns + FK relationships as compact DDL for SQLCoder.
     */
    public String formatSchemaForPrompt(List<TableMetadata> tables, Set<String> allowedTables) {
        StringBuilder sb = new StringBuilder();
        for (TableMetadata table : tables) {
            sb.append("CREATE TABLE ").append(table.getTableName()).append(" (\n");
            List<String> colLines = new ArrayList<>();
            for (ColumnMetadata col : table.getColumns()) {
                if (col.isSensitive()) {
                    continue;
                }
                StringBuilder line = new StringBuilder("  ")
                        .append(col.getName())
                        .append(" ")
                        .append(col.getColumnType());
                if (col.isPrimaryKey()) {
                    line.append(" PRIMARY KEY");
                }
                if (!col.isNullable()) {
                    line.append(" NOT NULL");
                }
                colLines.add(line.toString());
            }
            for (RelationshipMetadata rel : table.getRelationships()) {
                if (isTableAllowed(rel.getReferencedTableName(), allowedTables)) {
                    colLines.add("  FOREIGN KEY (" + rel.getColumnName() + ") REFERENCES "
                            + rel.getReferencedTableName() + "(" + rel.getReferencedColumnName() + ")");
                }
            }
            sb.append(String.join(",\n", colLines)).append("\n);\n\n");
        }
        return sb.toString();
    }

    public boolean isSensitiveColumn(String columnName) {
        if (columnName == null) {
            return false;
        }
        String lower = columnName.toLowerCase(Locale.ROOT);
        for (String keyword : SENSITIVE_COLUMN_KEYWORDS) {
            if (lower.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean isExpired(DatabaseSchemaMetadata metadata) {
        long ttl = properties.getSchemaCacheTtlSeconds();
        return metadata.getDiscoveredAt() == null
                || metadata.getDiscoveredAt().plusSeconds(ttl).isBefore(Instant.now());
    }

    private DatabaseSchemaMetadata discoverSchema() {
        Map<String, TableMetadata> tables = new LinkedHashMap<>();
        List<RelationshipMetadata> allRelationships = new ArrayList<>();

        String schemaName = "smart_erp";
        try {
            String db = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
            if (db != null && !db.isBlank()) {
                schemaName = db;
            }
        } catch (Exception ex) {
            log.debug("Could not resolve DATABASE() name: {}", ex.getMessage());
        }

        String colSql = """
                SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                ORDER BY TABLE_NAME, ORDINAL_POSITION
                """;

        try {
            jdbcTemplate.query(colSql, rs -> {
                String tableName = rs.getString("TABLE_NAME");
                String columnName = rs.getString("COLUMN_NAME");
                String columnType = rs.getString("COLUMN_TYPE");
                boolean nullable = "YES".equalsIgnoreCase(rs.getString("IS_NULLABLE"));
                String columnKey = rs.getString("COLUMN_KEY");

                TableMetadata table = tables.computeIfAbsent(tableName,
                        name -> TableMetadata.builder().tableName(name).build());

                table.getColumns().add(ColumnMetadata.builder()
                        .name(columnName)
                        .columnType(columnType)
                        .nullable(nullable)
                        .primaryKey("PRI".equalsIgnoreCase(columnKey))
                        .columnKey(columnKey)
                        .sensitive(isSensitiveColumn(columnName))
                        .build());
            });

            String fkSql = """
                    SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                    """;

            jdbcTemplate.query(fkSql, rs -> {
                RelationshipMetadata rel = RelationshipMetadata.builder()
                        .tableName(rs.getString("TABLE_NAME"))
                        .columnName(rs.getString("COLUMN_NAME"))
                        .referencedTableName(rs.getString("REFERENCED_TABLE_NAME"))
                        .referencedColumnName(rs.getString("REFERENCED_COLUMN_NAME"))
                        .build();
                allRelationships.add(rel);
                TableMetadata table = tables.get(rel.getTableName());
                if (table != null) {
                    table.getRelationships().add(rel);
                }
            });
        } catch (Exception ex) {
            log.warn("INFORMATION_SCHEMA discovery encountered an error: {}", ex.getMessage());
        }

        return DatabaseSchemaMetadata.builder()
                .schemaName(schemaName)
                .discoveredAt(Instant.now())
                .schemaSignature(computeSignature(tables))
                .tables(tables)
                .relationships(allRelationships)
                .build();
    }

    private TableMetadata findTableCaseInsensitive(DatabaseSchemaMetadata schema, String name) {
        for (Map.Entry<String, TableMetadata> entry : schema.getTables().entrySet()) {
            if (entry.getKey().equalsIgnoreCase(name)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private boolean isTableAllowed(String tableName, Set<String> allowedTables) {
        return allowedTables.stream().anyMatch(t -> t.equalsIgnoreCase(tableName));
    }

    private String computeSignature(Map<String, TableMetadata> tables) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            for (TableMetadata t : tables.values()) {
                md.update(t.getTableName().getBytes(StandardCharsets.UTF_8));
                for (ColumnMetadata c : t.getColumns()) {
                    md.update((c.getName() + ":" + c.getColumnType()).getBytes(StandardCharsets.UTF_8));
                }
            }
            return Base64.getEncoder().encodeToString(md.digest());
        } catch (Exception e) {
            return String.valueOf(tables.size());
        }
    }
}
