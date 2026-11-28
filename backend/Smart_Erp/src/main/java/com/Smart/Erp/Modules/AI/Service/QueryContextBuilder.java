package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.Config.AiQueryProperties;
import com.Smart.Erp.Modules.AI.DTO.UserQueryContext;
import com.Smart.Erp.Modules.AI.Metadata.TableMetadata;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Builds constrained, injection-resistant prompts for SQLCoder 7B using only
 * authorized schema metadata and server-resolved user context.
 */
@Service
@RequiredArgsConstructor
public class QueryContextBuilder {

    private final SchemaMetadataService schemaMetadataService;
    private final AiQueryProperties properties;

    public String buildSqlCoderPrompt(
            String userQuestion,
            String language,
            UserQueryContext context,
            List<TableMetadata> authorizedTables
    ) {
        String schemaDdl = schemaMetadataService.formatSchemaForPrompt(authorizedTables, context.getAllowedTables());
        String allowedTableList = authorizedTables.stream()
                .map(TableMetadata::getTableName)
                .collect(Collectors.joining(", "));

        String scopeDescription = buildScopeDescription(context);

        return """
                ### Task
                Generate a single valid MySQL 8.4 SELECT query to answer the user's question.
                The user's question may be in English, Hindi, Hinglish, or another language.

                ### Rules
                - Generate ONLY a single SELECT statement. No INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, UNION, or multiple statements.
                - Use ONLY tables and columns from the Database Schema below. Never invent table or column names.
                - Allowed tables: %s
                - Always apply the Data Scope constraints in the WHERE clause.
                - Avoid SELECT *. Select only relevant columns with clear aliases.
                - Use NULLIF(..., 0) to prevent division by zero when computing percentages.
                - Always include LIMIT %d (or smaller if requested).
                - Today's date is %s.
                - Return ONLY the SQL query without explanations.

                ### Data Scope
                %s

                ### Database Schema
                %s

                ### Question (language: %s)
                %s

                ### SQL
                """.formatted(
                allowedTableList,
                properties.getMaxRows(),
                LocalDate.now(),
                scopeDescription,
                schemaDdl,
                language,
                sanitizeQuestion(userQuestion)
        );
    }

    private String buildScopeDescription(UserQueryContext context) {
        StringBuilder sb = new StringBuilder();
        sb.append("- Role: ").append(context.getRole().name()).append("\n");
        sb.append("- University ID (tenant): ").append(context.getUniversityId()).append("\n");
        if (context.getCurrentAcademicYearId() != null) {
            sb.append("- Current Academic Year ID: ").append(context.getCurrentAcademicYearId())
                    .append(" (").append(context.getCurrentAcademicYearName()).append(")\n");
        }

        if (context.getRole() == UserRoles.STUDENT) {
            sb.append("- Authenticated Student ID: ").append(context.getStudentId()).append("\n");
            sb.append("- Authenticated User ID: ").append(context.getUserId()).append("\n");
            if (!context.getStudentEnrollmentIds().isEmpty()) {
                sb.append("- Student Enrollment IDs: ").append(context.getStudentEnrollmentIds()).append("\n");
            }
            sb.append("- Restriction: Query ONLY this student's own records (student_id = ")
                    .append(context.getStudentId()).append(").\n");
        } else if (context.getRole() == UserRoles.TEACHER || context.getRole() == UserRoles.MENTOR) {
            sb.append("- Authenticated Teacher ID: ").append(context.getTeacherId()).append("\n");
            sb.append("- Authenticated User ID: ").append(context.getUserId()).append("\n");
            if (!context.getTeacherEnrollmentIds().isEmpty()) {
                sb.append("- Teacher Enrollment IDs: ").append(context.getTeacherEnrollmentIds()).append("\n");
            }
            if (!context.getAllowedSubjectIds().isEmpty()) {
                sb.append("- Assigned Subject IDs: ").append(context.getAllowedSubjectIds()).append("\n");
            }
            if (!context.getAllowedSectionIds().isEmpty()) {
                sb.append("- Assigned Section IDs: ").append(context.getAllowedSectionIds()).append("\n");
            }
            sb.append("- Restriction: Query ONLY records belonging to this teacher (teacher_id = ")
                    .append(context.getTeacherId()).append(") or their assigned subjects/sections.\n");
        } else {
            if (!context.getAllowedDepartmentIds().isEmpty()) {
                sb.append("- Permitted Department IDs: ").append(context.getAllowedDepartmentIds()).append("\n");
            }
            if (!context.getAllowedCourseIds().isEmpty()) {
                sb.append("- Permitted Course IDs: ").append(context.getAllowedCourseIds()).append("\n");
            }
            if (!context.getAllowedSectionIds().isEmpty()) {
                sb.append("- Permitted Section IDs: ").append(context.getAllowedSectionIds()).append("\n");
            }
        }
        return sb.toString();
    }

    private String sanitizeQuestion(String question) {
        if (question == null) return "";
        return question.replace("###", " ").trim();
    }
}
