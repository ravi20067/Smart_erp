package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.DTO.UserQueryContext;
import com.Smart.Erp.Modules.AI.Exception.SqlValidationException;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.expression.JdbcNamedParameter;
import net.sf.jsqlparser.expression.operators.conditional.AndExpression;
import net.sf.jsqlparser.expression.operators.relational.EqualsTo;
import net.sf.jsqlparser.expression.operators.relational.ExpressionList;
import net.sf.jsqlparser.expression.operators.relational.InExpression;
import net.sf.jsqlparser.expression.operators.relational.ParenthesedExpressionList;
import net.sf.jsqlparser.schema.Column;
import net.sf.jsqlparser.schema.Table;
import net.sf.jsqlparser.statement.select.FromItem;
import net.sf.jsqlparser.statement.select.Join;
import net.sf.jsqlparser.statement.select.PlainSelect;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Server-controlled data scope enforcement.
 * Injects parameterized WHERE predicates into the validated JSqlParser AST so that
 * LLM-generated SQL can never expand user permissions or bypass tenant/role isolation.
 */
@Service
public class QueryScopeEnforcementService {

    public ScopedSql enforceScope(PlainSelect plainSelect, UserQueryContext context) {
        Map<String, String> tableAliases = collectTopLevelTableAliases(plainSelect);
        Map<String, Object> parameters = new LinkedHashMap<>();
        List<Expression> mandatoryPredicates = new ArrayList<>();

        // 1. Multi-tenant university isolation
        enforceTenantIsolation(tableAliases, context, mandatoryPredicates, parameters);

        // 2. Role-based row-level scope enforcement
        UserRoles role = context.getRole();
        if (role == UserRoles.STUDENT) {
            enforceStudentScope(tableAliases, context, mandatoryPredicates, parameters);
        } else if (role == UserRoles.TEACHER || role == UserRoles.MENTOR) {
            enforceTeacherScope(tableAliases, context, mandatoryPredicates, parameters);
        } else if (role == UserRoles.HEAD_OF_DEPARTMENT
                || role == UserRoles.PROGRAM_COORDINATOR
                || role == UserRoles.SCHOOL_DEAN) {
            enforceScopedAcademicRole(tableAliases, context, mandatoryPredicates, parameters);
        }

        // Reject if no scope predicate could be proven for non-global roles
        if (mandatoryPredicates.isEmpty() && !context.isGlobalUniversityScope()) {
            throw new SqlValidationException("SCOPE_NOT_PROVABLE",
                    "Query cannot be safely scoped to your authorized records.");
        }

        // Combine existing WHERE (wrapped in parentheses to defeat OR bypass) with mandatory predicates
        Expression combinedWhere = plainSelect.getWhere();
        if (combinedWhere != null) {
            combinedWhere = new ParenthesedExpressionList<>(combinedWhere);
        }
        for (Expression predicate : mandatoryPredicates) {
            combinedWhere = (combinedWhere == null)
                    ? predicate
                    : new AndExpression(combinedWhere, predicate);
        }
        plainSelect.setWhere(combinedWhere);

        return new ScopedSql(plainSelect.toString(), parameters);
    }

    private void enforceTenantIsolation(
            Map<String, String> tableAliases,
            UserQueryContext context,
            List<Expression> predicates,
            Map<String, Object> parameters
    ) {
        Long universityId = context.getUniversityId();
        if (universityId == null) {
            throw new SqlValidationException("MISSING_TENANT_SCOPE", "University tenant ID is required.");
        }

        if (tableAliases.containsKey("universities")) {
            predicates.add(equalsParam(tableAliases.get("universities"), "id", "scope_university_id"));
            parameters.put("scope_university_id", universityId);
        }
        for (String tenantTable : List.of("users", "academic_years", "schools", "scholarships", "campus_check_in_records")) {
            if (tableAliases.containsKey(tenantTable)) {
                predicates.add(equalsParam(tableAliases.get(tenantTable), "university_id", "scope_university_id"));
                parameters.put("scope_university_id", universityId);
            }
        }
    }

    private void enforceStudentScope(
            Map<String, String> tableAliases,
            UserQueryContext context,
            List<Expression> predicates,
            Map<String, Object> parameters
    ) {
        boolean scoped = false;

        if (tableAliases.containsKey("students")) {
            predicates.add(equalsParam(tableAliases.get("students"), "id", "scope_student_id"));
            parameters.put("scope_student_id", context.getStudentId());
            scoped = true;
        }
        if (tableAliases.containsKey("student_enrollment")) {
            predicates.add(equalsParam(tableAliases.get("student_enrollment"), "student_id", "scope_student_id"));
            parameters.put("scope_student_id", context.getStudentId());
            scoped = true;
        }
        if (tableAliases.containsKey("student_attendances")) {
            predicates.add(equalsParam(tableAliases.get("student_attendances"), "student_id", "scope_student_id"));
            parameters.put("scope_student_id", context.getStudentId());
            scoped = true;
        }
        if (tableAliases.containsKey("users")) {
            predicates.add(equalsParam(tableAliases.get("users"), "id", "scope_user_id"));
            parameters.put("scope_user_id", context.getUserId());
            scoped = true;
        }
        if (tableAliases.containsKey("basic_details")) {
            predicates.add(equalsParam(tableAliases.get("basic_details"), "user_id", "scope_user_id"));
            parameters.put("scope_user_id", context.getUserId());
            scoped = true;
        }
        if (tableAliases.containsKey("book_issues")) {
            predicates.add(equalsParam(tableAliases.get("book_issues"), "student_id", "scope_student_id"));
            parameters.put("scope_student_id", context.getStudentId());
            scoped = true;
        }
        if (tableAliases.containsKey("exam_results") && !tableAliases.containsKey("student_enrollment")) {
            if (context.getStudentEnrollmentIds().isEmpty()) {
                throw new SqlValidationException("SCOPE_NOT_PROVABLE", "No active student enrollment found.");
            }
            predicates.add(inParam(tableAliases.get("exam_results"), "student_enrollment_id",
                    "scope_enrollment_ids", context.getStudentEnrollmentIds(), parameters));
            scoped = true;
        }
        if (tableAliases.containsKey("student_fee_accounts") && !tableAliases.containsKey("student_enrollment")) {
            if (context.getStudentEnrollmentIds().isEmpty()) {
                throw new SqlValidationException("SCOPE_NOT_PROVABLE", "No active student enrollment found.");
            }
            predicates.add(inParam(tableAliases.get("student_fee_accounts"), "student_enrollment_id",
                    "scope_enrollment_ids", context.getStudentEnrollmentIds(), parameters));
            scoped = true;
        }

        // Section/Course/Subject/Timetable/Assignment queries without student tables must still be scoped to enrolled sections/courses
        if (!scoped) {
            if (tableAliases.containsKey("sections") && !context.getAllowedSectionIds().isEmpty()) {
                predicates.add(inParam(tableAliases.get("sections"), "id",
                        "scope_section_ids", context.getAllowedSectionIds(), parameters));
                scoped = true;
            } else if (tableAliases.containsKey("courses") && !context.getAllowedCourseIds().isEmpty()) {
                predicates.add(inParam(tableAliases.get("courses"), "id",
                        "scope_course_ids", context.getAllowedCourseIds(), parameters));
                scoped = true;
            } else if (tableAliases.containsKey("subjects") && !context.getAllowedCourseIds().isEmpty()) {
                predicates.add(inParam(tableAliases.get("subjects"), "course_id",
                        "scope_course_ids", context.getAllowedCourseIds(), parameters));
                scoped = true;
            }
        }

        if (!scoped) {
            throw new SqlValidationException("SCOPE_NOT_PROVABLE",
                    "Student query must be scoped to your own student or enrolled course/section records.");
        }
    }

    private void enforceTeacherScope(
            Map<String, String> tableAliases,
            UserQueryContext context,
            List<Expression> predicates,
            Map<String, Object> parameters
    ) {
        boolean scoped = false;

        if (tableAliases.containsKey("teachers")) {
            predicates.add(equalsParam(tableAliases.get("teachers"), "id", "scope_teacher_id"));
            parameters.put("scope_teacher_id", context.getTeacherId());
            scoped = true;
        }
        if (tableAliases.containsKey("teacher_enrollment")) {
            predicates.add(equalsParam(tableAliases.get("teacher_enrollment"), "teacher_id", "scope_teacher_id"));
            parameters.put("scope_teacher_id", context.getTeacherId());
            scoped = true;
        }
        if (tableAliases.containsKey("attendance_sessions")) {
            predicates.add(equalsParam(tableAliases.get("attendance_sessions"), "teacher_id", "scope_teacher_id"));
            parameters.put("scope_teacher_id", context.getTeacherId());
            scoped = true;
        }
        if (tableAliases.containsKey("section_timetable_entries") && !context.getTeacherEnrollmentIds().isEmpty()) {
            predicates.add(inParam(tableAliases.get("section_timetable_entries"), "teacher_enrollment_id",
                    "scope_teacher_enrollment_ids", context.getTeacherEnrollmentIds(), parameters));
            scoped = true;
        }

        // If querying students directly without attendance_sessions/section_timetable_entries, restrict to allowed sections or reject
        if ((tableAliases.containsKey("students") || tableAliases.containsKey("student_attendances"))
                && !tableAliases.containsKey("attendance_sessions")
                && !tableAliases.containsKey("section_timetable_entries")) {
            if (tableAliases.containsKey("sectionGroup") && !context.getAllowedSectionGroupIds().isEmpty()) {
                predicates.add(inParam(tableAliases.get("sectionGroup"), "id",
                        "scope_section_group_ids", context.getAllowedSectionGroupIds(), parameters));
                scoped = true;
            } else if (tableAliases.containsKey("sections") && !context.getAllowedSectionIds().isEmpty()) {
                predicates.add(inParam(tableAliases.get("sections"), "id",
                        "scope_section_ids", context.getAllowedSectionIds(), parameters));
                scoped = true;
            } else {
                throw new SqlValidationException("SCOPE_NOT_PROVABLE",
                        "Teacher access to student records requires an assigned section or attendance session join.");
            }
        }

        if (!scoped && !context.getAllowedSubjectIds().isEmpty() && tableAliases.containsKey("subjects")) {
            predicates.add(inParam(tableAliases.get("subjects"), "id",
                    "scope_subject_ids", context.getAllowedSubjectIds(), parameters));
            scoped = true;
        }

        if (!scoped) {
            throw new SqlValidationException("SCOPE_NOT_PROVABLE",
                    "Teacher query must be scoped to your teaching assignments or authorized sections.");
        }
    }

    private void enforceScopedAcademicRole(
            Map<String, String> tableAliases,
            UserQueryContext context,
            List<Expression> predicates,
            Map<String, Object> parameters
    ) {
        if (!context.getAllowedDepartmentIds().isEmpty() && tableAliases.containsKey("departments")) {
            predicates.add(inParam(tableAliases.get("departments"), "id",
                    "scope_dept_ids", context.getAllowedDepartmentIds(), parameters));
        }
        if (!context.getAllowedCourseIds().isEmpty() && tableAliases.containsKey("courses")) {
            predicates.add(inParam(tableAliases.get("courses"), "id",
                    "scope_course_ids", context.getAllowedCourseIds(), parameters));
        }
        if (!context.getAllowedSectionIds().isEmpty() && tableAliases.containsKey("sections")) {
            predicates.add(inParam(tableAliases.get("sections"), "id",
                    "scope_section_ids", context.getAllowedSectionIds(), parameters));
        }
    }

    private Map<String, String> collectTopLevelTableAliases(PlainSelect plainSelect) {
        Map<String, String> aliases = new LinkedHashMap<>();
        registerFromItem(plainSelect.getFromItem(), aliases);
        if (plainSelect.getJoins() != null) {
            for (Join join : plainSelect.getJoins()) {
                registerFromItem(join.getFromItem(), aliases);
            }
        }
        return aliases;
    }

    private void registerFromItem(FromItem fromItem, Map<String, String> aliases) {
        if (fromItem instanceof Table table) {
            String tableName = table.getName();
            String alias = (table.getAlias() != null && table.getAlias().getName() != null)
                    ? table.getAlias().getName()
                    : tableName;
            aliases.putIfAbsent(tableName.toLowerCase(Locale.ROOT), alias);
            // Preserve exact case key as well for camelCase tables like sectionGroup
            aliases.putIfAbsent(tableName, alias);
        }
    }

    private Expression equalsParam(String tableAlias, String columnName, String paramName) {
        EqualsTo eq = new EqualsTo();
        eq.setLeftExpression(new Column(new Table(tableAlias), columnName));
        eq.setRightExpression(new JdbcNamedParameter(paramName));
        return eq;
    }

    private Expression inParam(
            String tableAlias,
            String columnName,
            String paramName,
            Set<Long> values,
            Map<String, Object> parameters
    ) {
        parameters.put(paramName, new ArrayList<>(values));
        InExpression in = new InExpression();
        in.setLeftExpression(new Column(new Table(tableAlias), columnName));
        in.setRightExpression(new ExpressionList<>(new JdbcNamedParameter(paramName)));
        return in;
    }

    public record ScopedSql(String sql, Map<String, Object> parameters) {
    }
}
