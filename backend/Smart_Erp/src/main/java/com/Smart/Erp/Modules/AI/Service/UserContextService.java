package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.DTO.UserQueryContext;
import com.Smart.Erp.Modules.AI.Exception.AiQueryException;
import com.Smart.Erp.Modules.AI.Security.AiQueryPermissionResolver;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Repo.AcademicYearRepository;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Resolves the authenticated user's ERP identity, role, academic scope, and permissions
 * strictly from Spring SecurityContext and backend repositories.
 */
@Service
@RequiredArgsConstructor
public class UserContextService {

    private final AuthorizationService authorizationService;
    private final AiQueryPermissionResolver permissionResolver;
    private final StudentRepo studentRepo;
    private final StudentEnrollmentRepo studentEnrollmentRepo;
    private final TeacherRepo teacherRepo;
    private final AcademicYearRepository academicYearRepository;

    @Transactional(readOnly = true)
    public UserQueryContext resolveCurrentUserContext() {
        User user = authorizationService.getCurrentUser();
        if (user == null || !Boolean.TRUE.equals(user.getEnabled()) || user.getUserRole() == null) {
            throw new AiQueryException("UNAUTHORIZED", "Authenticated and enabled user is required.");
        }

        if (user.getUniversity() == null || user.getUniversity().getId() == null) {
            throw new AiQueryException("MISSING_TENANT_SCOPE", "User is not associated with a university.");
        }

        String fullName = user.getBasicDetail() != null
                ? (safeStr(user.getBasicDetail().getFirstName()) + " " + safeStr(user.getBasicDetail().getLastName())).trim()
                : user.getUsername();

        UserQueryContext context = UserQueryContext.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(fullName.isBlank() ? user.getUsername() : fullName)
                .role(user.getUserRole())
                .universityId(user.getUniversity().getId())
                .universityName(user.getUniversity().getName())
                .build();

        resolveCurrentAcademicYear(user.getUniversity().getId(), context);
        permissionResolver.resolvePermissionsAndScopes(user, context);

        if (user.getUserRole() == UserRoles.STUDENT) {
            resolveStudentContext(user, context);
        } else if (user.getUserRole() == UserRoles.TEACHER || user.getUserRole() == UserRoles.MENTOR) {
            resolveTeacherContext(user, context);
        }

        return context;
    }

    private void resolveCurrentAcademicYear(Long universityId, UserQueryContext context) {
        List<AcademicYear> years = academicYearRepository.findAll();
        years.stream()
                .filter(ay -> ay.getUniversity() != null
                        && universityId.equals(ay.getUniversity().getId())
                        && Boolean.TRUE.equals(ay.getCurrent()))
                .findFirst()
                .ifPresent(ay -> {
                    context.setCurrentAcademicYearId(ay.getId());
                    context.setCurrentAcademicYearName(ay.getName());
                });
    }

    private void resolveStudentContext(User user, UserQueryContext context) {
        Student student = studentRepo.findByUser(user).orElse(null);
        if (student == null) {
            return;
        }
        context.setStudentId(student.getId());
        context.setRegistrationNumber(student.getRegistrationNumber());

        List<StudentEnrollment> enrollments = studentEnrollmentRepo.findAllByStudent(student);
        for (StudentEnrollment enrollment : enrollments) {
            if (enrollment.getStatus() != EnrollmentStatus.ACTIVE) {
                continue;
            }
            context.getStudentEnrollmentIds().add(enrollment.getId());
            if (enrollment.getSectionGroup() != null) {
                context.getAllowedSectionGroupIds().add(enrollment.getSectionGroup().getId());
                if (enrollment.getSectionGroup().getSection() != null) {
                    var section = enrollment.getSectionGroup().getSection();
                    context.getAllowedSectionIds().add(section.getId());
                    if (section.getCourse() != null) {
                        context.getAllowedCourseIds().add(section.getCourse().getId());
                    }
                }
            }
        }
    }

    private void resolveTeacherContext(User user, UserQueryContext context) {
        Teacher teacher = teacherRepo.findByUser(user).orElse(null);
        if (teacher == null) {
            return;
        }
        context.setTeacherId(teacher.getId());

        if (teacher.getEnrollments() != null) {
            for (TeacherEnrollment enrollment : teacher.getEnrollments()) {
                if (enrollment.getStatus() != EnrollmentStatus.ACTIVE) {
                    continue;
                }
                context.getTeacherEnrollmentIds().add(enrollment.getId());
                if (enrollment.getSubjects() != null) {
                    for (Subject subject : enrollment.getSubjects()) {
                        context.getAllowedSubjectIds().add(subject.getId());
                        if (subject.getCourse() != null) {
                            context.getAllowedCourseIds().add(subject.getCourse().getId());
                        }
                    }
                }
            }
        }
    }

    private static String safeStr(String value) {
        return value == null ? "" : value;
    }
}
