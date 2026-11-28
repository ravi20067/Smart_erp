package com.Smart.Erp.Modules.AI.Security;

import com.Smart.Erp.Modules.AI.DTO.QueryAuthorizationResult;
import com.Smart.Erp.Modules.AI.DTO.UserQueryContext;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Resolves table access and resource-level scopes using the existing {@link AuthorizationService}.
 * Fail-closed: denies access whenever user, role, or university scope cannot be resolved.
 */
@Component
@RequiredArgsConstructor
public class AiQueryPermissionResolver {

    private static final Set<String> NEVER_ALLOWED_TABLES = Set.of(
            "permissions",
            "role_permissions",
            "user_permission_grants",
            "roles",
            "user_roles",
            "qr_token_usages",
            "student_face_templates",
            "face_verification_attempts",
            "face_verification_sessions",
            "local_handshake_records",
            "ai_query_audit_logs"
    );

    private static final Set<String> STUDENT_TABLES = Set.of(
            "students", "student_enrollment", "student_attendances", "attendance_sessions",
            "subjects", "courses", "departments", "schools", "sections", "sectionGroup",
            "academic_years", "assignments", "chapters", "exams", "exam_results",
            "section_timetable_versions", "section_timetable_entries", "base_time_table_periods",
            "rooms", "student_fee_accounts", "fee_payments", "book_issues", "books",
            "universities", "basic_details", "users"
    );

    private static final Set<String> TEACHER_TABLES = Set.of(
            "teachers", "teacher_enrollment", "subject_teacher_enrollments",
            "subjects", "courses", "departments", "schools", "sections", "sectionGroup",
            "academic_years", "students", "student_enrollment", "student_attendances",
            "attendance_sessions", "assignments", "chapters", "exams", "exam_results",
            "section_timetable_versions", "section_timetable_entries", "base_time_table_periods",
            "rooms", "universities", "basic_details", "users"
    );

    private static final Set<String> ACADEMIC_ADMIN_TABLES = Set.of(
            "students", "student_enrollment", "teachers", "teacher_enrollment",
            "subject_teacher_enrollments", "subjects", "courses", "departments",
            "schools", "sections", "sectionGroup", "academic_years", "specializations",
            "student_attendances", "attendance_sessions", "assignments", "chapters",
            "exams", "exam_results", "section_timetable_versions", "section_timetable_entries",
            "base_time_table_periods", "rooms", "universities", "basic_details", "users"
    );

    private static final Set<String> FINANCE_TABLES = Set.of(
            "fee_structures", "fee_components", "student_fee_accounts",
            "student_fee_adjustments", "fee_payments", "scholarships",
            "students", "student_enrollment", "courses", "sections", "sectionGroup",
            "academic_years", "universities", "basic_details", "users"
    );

    private static final Set<String> EXAM_TABLES = Set.of(
            "exams", "exam_results", "subjects", "courses", "sections", "sectionGroup",
            "students", "student_enrollment", "academic_years", "universities",
            "basic_details", "users"
    );

    private static final Set<String> LIBRARY_TABLES = Set.of(
            "books", "book_issues", "students", "student_enrollment",
            "universities", "basic_details", "users"
    );

    private static final Set<String> SECURITY_GUARD_TABLES = Set.of(
            "security_guards", "security_guard_check_ins", "campus_check_in_records",
            "students", "universities", "basic_details", "users"
    );

    private final AuthorizationService authorizationService;

    public void resolvePermissionsAndScopes(User user, UserQueryContext context) {
        if (user == null || !Boolean.TRUE.equals(user.getEnabled()) || user.getUserRole() == null) {
            return;
        }

        UserRoles role = user.getUserRole();
        context.setGlobalUniversityScope(role == UserRoles.SUPER_ADMIN || role == UserRoles.ADMIN);

        // Populate resource-level READ permissions from existing AuthorizationService
        context.getAllowedSchoolIds().addAll(readPermittedIds(ResourceType.SCHOOL));
        context.getAllowedDepartmentIds().addAll(readPermittedIds(ResourceType.DEPARTMENT));
        context.getAllowedCourseIds().addAll(readPermittedIds(ResourceType.COURSE));
        context.getAllowedSectionIds().addAll(readPermittedIds(ResourceType.SECTION));
        context.getAllowedSectionGroupIds().addAll(readPermittedIds(ResourceType.SECTION_GROUP));
        context.getAllowedSubjectIds().addAll(readPermittedIds(ResourceType.SUBJECT));

        Set<String> tables = new LinkedHashSet<>();
        switch (role) {
            case STUDENT -> tables.addAll(STUDENT_TABLES);
            case TEACHER, MENTOR -> tables.addAll(TEACHER_TABLES);
            case SUPER_ADMIN, ADMIN, DEAN -> {
                tables.addAll(ACADEMIC_ADMIN_TABLES);
                tables.addAll(FINANCE_TABLES);
                tables.addAll(LIBRARY_TABLES);
            }
            case SCHOOL_DEAN, HEAD_OF_DEPARTMENT, PROGRAM_COORDINATOR -> tables.addAll(ACADEMIC_ADMIN_TABLES);
            case ACCOUNTANT -> tables.addAll(FINANCE_TABLES);
            case EXAM_CONTROLLER -> tables.addAll(EXAM_TABLES);
            case LIBRARIAN -> tables.addAll(LIBRARY_TABLES);
            case SECURITY_GUARD -> tables.addAll(SECURITY_GUARD_TABLES);
            case HR, COUNSELOR -> {
                tables.add("users");
                tables.add("basic_details");
                tables.add("universities");
                tables.add("students");
                tables.add("teachers");
                tables.add("courses");
                tables.add("departments");
                tables.add("schools");
            }
        }

        tables.removeAll(NEVER_ALLOWED_TABLES);
        context.setAllowedTables(tables);
    }

    public QueryAuthorizationResult authorizeExecution(UserQueryContext context, Set<String> referencedTables) {
        if (context == null || context.getUserId() == null || context.getRole() == null
                || context.getUniversityId() == null) {
            return QueryAuthorizationResult.denied("UNAUTHENTICATED_OR_MISSING_TENANT");
        }

        if (referencedTables == null || referencedTables.isEmpty()) {
            return QueryAuthorizationResult.denied("NO_TABLES_REFERENCED");
        }

        for (String table : referencedTables) {
            String normalized = table.toLowerCase(Locale.ROOT);
            if (NEVER_ALLOWED_TABLES.contains(normalized)) {
                return QueryAuthorizationResult.denied("RESTRICTED_TABLE_ACCESS: " + table);
            }
            boolean allowed = context.getAllowedTables().stream()
                    .anyMatch(t -> t.equalsIgnoreCase(table));
            if (!allowed) {
                return QueryAuthorizationResult.denied("INSUFFICIENT_PERMISSION_FOR_TABLE: " + table);
            }
        }

        if (context.getRole() == UserRoles.STUDENT && context.getStudentId() == null) {
            return QueryAuthorizationResult.denied("STUDENT_PROFILE_NOT_FOUND");
        }
        if ((context.getRole() == UserRoles.TEACHER || context.getRole() == UserRoles.MENTOR)
                && context.getTeacherId() == null) {
            return QueryAuthorizationResult.denied("TEACHER_PROFILE_NOT_FOUND");
        }

        return QueryAuthorizationResult.allowed();
    }

    private Set<Long> readPermittedIds(ResourceType resourceType) {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(resourceType);
        if (map == null || map.isEmpty()) {
            return Set.of();
        }
        Set<Long> ids = new LinkedHashSet<>();
        for (Map.Entry<Long, List<PermissionAction>> entry : map.entrySet()) {
            if (entry.getKey() != null && entry.getValue() != null
                    && entry.getValue().contains(PermissionAction.READ)) {
                ids.add(entry.getKey());
            }
        }
        return ids;
    }
}
