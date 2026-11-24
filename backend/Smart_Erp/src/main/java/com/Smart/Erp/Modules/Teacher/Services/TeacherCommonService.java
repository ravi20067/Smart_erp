package com.Smart.Erp.Modules.Teacher.Services;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherEnrollmentRepo;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@AllArgsConstructor
public class TeacherCommonService {

    private final TeacherRepo teacherRepo;
    private final TeacherEnrollmentRepo teacherEnrollmentRepo;
    private final UserCommonService userService;

    public Teacher getTeacher(Long id) {
        return teacherRepo.findById(id).orElseThrow(
                () ->
                        new ResourceNotFoundException("Teacher not found with this id : " + id)
        );
    }

    public TeacherEnrollment getTeacherEnrollment(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Teacher enrollment ID must not be null");
        }
        return teacherEnrollmentRepo.findById(id).orElseGet(() -> {
            Teacher teacher = teacherRepo.findById(id).orElseThrow(
                    () -> new ResourceNotFoundException("Teacher Enrollment not found with this id : " + id)
            );
            if (teacher.getEnrollments() != null && !teacher.getEnrollments().isEmpty()) {
                return teacher.getEnrollments().stream()
                        .filter(Objects::nonNull)
                        .filter(enr -> enr.getStatus() == EnrollmentStatus.ACTIVE)
                        .findFirst()
                        .orElse(teacher.getEnrollments().get(0));
            }
            TeacherEnrollment newEnr = TeacherEnrollment.builder()
                    .teacher(teacher)
                    .status(EnrollmentStatus.ACTIVE)
                    .subjects(new HashSet<>())
                    .build();
            TeacherEnrollment saved = teacherEnrollmentRepo.save(newEnr);
            teacher.addEnrollment(saved);
            return saved;
        });
    }

    public TeacherEnrollment resolveTeacherEnrollment(Long teacherOrEnrollmentId, Subject subject) {
        if (teacherOrEnrollmentId == null) {
            throw new IllegalArgumentException("Teacher or enrollment ID must not be null");
        }
        Optional<TeacherEnrollment> optEnr = teacherEnrollmentRepo.findById(teacherOrEnrollmentId);
        if (optEnr.isPresent()) {
            TeacherEnrollment enr = optEnr.get();
            if (subject != null) {
                if (enr.getSubjects() == null) {
                    enr.setSubjects(new HashSet<>());
                }
                if (!enr.getSubjects().contains(subject)) {
                    enr.addSubject(subject);
                    enr = teacherEnrollmentRepo.save(enr);
                }
            }
            return enr;
        }

        Teacher teacher = teacherRepo.findById(teacherOrEnrollmentId).orElseThrow(
                () -> new ResourceNotFoundException("Teacher Enrollment not found with this id : " + teacherOrEnrollmentId)
        );

        if (teacher.getEnrollments() != null) {
            // First check if an active enrollment already has this subject
            if (subject != null) {
                for (TeacherEnrollment enr : teacher.getEnrollments()) {
                    if (enr != null && enr.getStatus() == EnrollmentStatus.ACTIVE &&
                            enr.getSubjects() != null && enr.getSubjects().contains(subject)) {
                        return enr;
                    }
                }
            }
            // Next check for any active enrollment and associate subject
            for (TeacherEnrollment enr : teacher.getEnrollments()) {
                if (enr != null && enr.getStatus() == EnrollmentStatus.ACTIVE) {
                    if (subject != null) {
                        if (enr.getSubjects() == null) {
                            enr.setSubjects(new HashSet<>());
                        }
                        if (!enr.getSubjects().contains(subject)) {
                            enr.addSubject(subject);
                            enr = teacherEnrollmentRepo.save(enr);
                        }
                    }
                    return enr;
                }
            }
        }

        // Create new active enrollment
        TeacherEnrollment newEnr = TeacherEnrollment.builder()
                .teacher(teacher)
                .status(EnrollmentStatus.ACTIVE)
                .subjects(new HashSet<>())
                .build();
        if (subject != null) {
            newEnr.addSubject(subject);
        }
        TeacherEnrollment saved = teacherEnrollmentRepo.save(newEnr);
        teacher.addEnrollment(saved);
        return saved;
    }
}
