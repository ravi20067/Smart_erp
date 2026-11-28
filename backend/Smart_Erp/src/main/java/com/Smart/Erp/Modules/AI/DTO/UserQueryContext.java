package com.Smart.Erp.Modules.AI.DTO;

import com.Smart.Erp.Modules.User.Enum.UserRoles;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Authenticated user's resolved ERP context and data-scope boundaries.
 * Built strictly on the server from SecurityContext + database repositories.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserQueryContext {

    private Long userId;
    private String username;
    private String fullName;
    private UserRoles role;
    private Long universityId;
    private String universityName;

    // Student-specific scope
    private Long studentId;
    private String registrationNumber;
    @Builder.Default
    private Set<Long> studentEnrollmentIds = new LinkedHashSet<>();

    // Teacher-specific scope
    private Long teacherId;
    @Builder.Default
    private Set<Long> teacherEnrollmentIds = new LinkedHashSet<>();

    // Resolved academic scope IDs (populated for student, teacher, or permission-scoped roles)
    private Long currentAcademicYearId;
    private String currentAcademicYearName;

    @Builder.Default
    private Set<Long> allowedSchoolIds = new LinkedHashSet<>();
    @Builder.Default
    private Set<Long> allowedDepartmentIds = new LinkedHashSet<>();
    @Builder.Default
    private Set<Long> allowedCourseIds = new LinkedHashSet<>();
    @Builder.Default
    private Set<Long> allowedSectionIds = new LinkedHashSet<>();
    @Builder.Default
    private Set<Long> allowedSectionGroupIds = new LinkedHashSet<>();
    @Builder.Default
    private Set<Long> allowedSubjectIds = new LinkedHashSet<>();

    private boolean globalUniversityScope;

    @Builder.Default
    private Set<String> allowedTables = new LinkedHashSet<>();
}
