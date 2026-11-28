package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.Config.AiQueryProperties;
import com.Smart.Erp.Modules.AI.DTO.QueryAuthorizationResult;
import com.Smart.Erp.Modules.AI.DTO.QueryExecutionResult;
import com.Smart.Erp.Modules.AI.Exception.AiQueryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSetMetaData;
import java.util.*;

/**
 * Executes validated, scope-enforced, read-only SELECT queries with row limits,
 * query timeout, sensitive-column filtering, and execution timing.
 */
@Slf4j
@Service
public class SqlExecutionService {

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    private final SchemaMetadataService schemaMetadataService;
    private final AiQueryProperties properties;

    public SqlExecutionService(
            @Qualifier("aiReadOnlyJdbcTemplate") JdbcTemplate aiReadOnlyJdbcTemplate,
            SchemaMetadataService schemaMetadataService,
            AiQueryProperties properties
    ) {
        this.namedParameterJdbcTemplate = new NamedParameterJdbcTemplate(aiReadOnlyJdbcTemplate);
        this.schemaMetadataService = schemaMetadataService;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public QueryExecutionResult executeReadOnly(
            String sql,
            Map<String, Object> parameters,
            QueryAuthorizationResult authorizationResult
    ) {
        if (authorizationResult == null || !authorizationResult.isAuthorized() || !authorizationResult.isReadOnly()) {
            throw new AiQueryException("ACCESS_DENIED", "Query execution is not authorized.");
        }

        long start = System.currentTimeMillis();
        MapSqlParameterSource paramSource = new MapSqlParameterSource(parameters != null ? parameters : Map.of());

        List<String> columns = new ArrayList<>();
        List<Map<String, Object>> rows = new ArrayList<>();
        int maxRows = properties.getMaxRows();

        try {
            namedParameterJdbcTemplate.query(sql, paramSource, rs -> {
                if (columns.isEmpty()) {
                    ResultSetMetaData meta = rs.getMetaData();
                    int colCount = meta.getColumnCount();
                    for (int i = 1; i <= colCount; i++) {
                        String label = meta.getColumnLabel(i);
                        if (!schemaMetadataService.isSensitiveColumn(label)) {
                            columns.add(label);
                        }
                    }
                }
                if (rows.size() < maxRows) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    ResultSetMetaData meta = rs.getMetaData();
                    int colCount = meta.getColumnCount();
                    for (int i = 1; i <= colCount; i++) {
                        String label = meta.getColumnLabel(i);
                        if (!schemaMetadataService.isSensitiveColumn(label)) {
                            row.put(label, rs.getObject(i));
                        }
                    }
                    rows.add(row);
                }
            });
        } catch (Exception ex) {
            log.warn("Read-only AI SQL execution failed: {}", ex.getMessage());
            throw new AiQueryException("QUERY_EXECUTION_FAILED",
                    "Unable to execute query safely against the database.", ex);
        }

        long durationMs = System.currentTimeMillis() - start;
        return QueryExecutionResult.builder()
                .columns(columns)
                .rows(rows)
                .rowCount(rows.size())
                .durationMs(durationMs)
                .truncated(rows.size() >= maxRows)
                .build();
    }
}
