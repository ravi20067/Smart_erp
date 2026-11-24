package com.Smart.Erp.Modules.Teacher.Services;

import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Subject.Repo.SubjectRepo;
import com.Smart.Erp.Modules.Subject.Services.SubjectCommonService;
import com.Smart.Erp.Modules.Teacher.DTO.Enrollment.TeacherEnrollmentRequest;
import com.Smart.Erp.Modules.Teacher.DTO.Enrollment.TeacherEnrollmentResponse;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherEnrollmentRepo;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class TeacherEnrollmentService {

    private final AuthorizationService authorizationService;
    private final TeacherRepo teacherRepo;
    private final SubjectRepo subjectRepo;
    private final TeacherEnrollmentRepo teacherEnrollmentRepo;
    private final TeacherCommonService teacherCommonService;
    private final SubjectCommonService subjectCommonService;
    private final AcademicCommonService academicCommonService;


    public List<TeacherEnrollmentResponse> getTeacherEnrollments() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.TEACHER);
        List<Teacher> teachers = teacherRepo.findAllById(map.keySet());

        return teachers.stream()
                .map(
                        teacher ->
                                teacher.mapToEnrollmentResponse(authorizationService.getPermissionAction(ResourceType.TEACHER, teacher.getId()))
                )
                .toList();
    }

    public TeacherEnrollmentResponse createTeacherEnrollment(TeacherEnrollmentRequest request) {
        Teacher teacher = teacherCommonService.getTeacher(request.getTeacherId());
        List<Subject> subjects = subjectRepo.findAllById(request.getSubjectIds());
        University university = teacher.getUser().getUniversity();
        List<Subject> universitySubjects = subjects.stream()
                .filter(subject -> checkSubjectBelongsToSameUniversity(university, subject))
                .toList();

        if (universitySubjects.isEmpty()) {
            throw new OperationNotAllowedException("At least one valid subject is required.");
        }

        TeacherEnrollment enrollment = TeacherEnrollment.builder()
                .teacher(teacher)
                .build();

        universitySubjects.forEach(enrollment::addSubject);

        teacherEnrollmentRepo.save(enrollment);

        return teacher.mapToEnrollmentResponse(authorizationService.getPermissionAction(ResourceType.TEACHER, teacher.getId()));
    }

    public TeacherEnrollmentResponse addSubjectToEnrollment(Long teacherId, Long subjectId, Long enrollmentId) {
        Teacher teacher = teacherCommonService.getTeacher(teacherId);
        Subject subject = subjectCommonService.getSubject(subjectId);
        TeacherEnrollment enrollment = teacherCommonService.getTeacherEnrollment(enrollmentId);

        if (enrollment != null && subject != null) {
            if (checkSubjectBelongsToSameUniversity(teacher.getUser().getUniversity(), subject)) {
                enrollment.addSubject(subject);
            } else {
                throw new OperationNotAllowedException("Subject does not belong to the same university as the teacher.");
            }
            teacherEnrollmentRepo.save(enrollment);
        } else {
            throw new OperationNotAllowedException("Enrollment or Subject not found.");
        }

        return teacher.mapToEnrollmentResponse(authorizationService.getPermissionAction(ResourceType.TEACHER, teacher.getId()));
    }

    public TeacherEnrollmentResponse removeSubjectFromEnrollment(Long teacherId, Long subjectId, Long enrollmentId) {
        Teacher teacher = teacherCommonService.getTeacher(teacherId);
        Subject subject = subjectCommonService.getSubject(subjectId);
        TeacherEnrollment enrollment = teacherCommonService.getTeacherEnrollment(enrollmentId);

        if (enrollment == null) {
            throw new OperationNotAllowedException("Enrollment not found.");
        }
        if (subject == null) {
            throw new OperationNotAllowedException("Subject not found.");
        }

        if (!checkSubjectBelongsToSameUniversity(teacher.getUser().getUniversity(), subject)) {
            throw new OperationNotAllowedException("Subject does not belong to the same university as the teacher.");
        }

        if (enrollment.getSubjects().contains(subject)) {
            enrollment.removeSubject(subject);
        } else {
            throw new OperationNotAllowedException("Subject is not associated with the enrollment.");
        }
        teacherEnrollmentRepo.save(enrollment);

        return teacher.mapToEnrollmentResponse(authorizationService.getPermissionAction(ResourceType.TEACHER, teacher.getId()));
    }

    public TeacherEnrollmentResponse deleteTeacherEnrollment(Long teacherId, Long enrollmentId) {
        Teacher teacher = teacherCommonService.getTeacher(teacherId);
        TeacherEnrollment enrollment = teacherCommonService.getTeacherEnrollment(enrollmentId);

        if (enrollment == null) {
            throw new OperationNotAllowedException("Enrollment not found.");
        }

        enrollment.getSubjects().forEach(subject ->
                subject.getSubjectTeachers().remove(enrollment)
        );
        enrollment.getSubjects().clear();
        teacher.removeEnrollment(enrollment);
        teacherEnrollmentRepo.delete(enrollment);

        return teacher.mapToEnrollmentResponse(authorizationService.getPermissionAction(ResourceType.TEACHER, teacher.getId()));
    }

    public List<CommonDTO> getSubjectsForTeacherEnrollment(Long universityId) {
        University university = academicCommonService.getUniversity(universityId);
        List<Subject> subjects = subjectCommonService.getSubjectsByUniversity(university);

        return subjects.stream()
                .map(CommonReference::toCommonDTO)
                .toList();
    }

    private boolean checkSubjectBelongsToSameUniversity(University university, Subject subject) {
        return subject.getCode().contains(university.getCode());
    }
}
