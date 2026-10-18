package com.Smart.Erp.Modules.Subject.Services;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Subject.DTO.Subject.SubjectRequest;
import com.Smart.Erp.Modules.Subject.DTO.Subject.SubjectResponse;
import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Subject.Repo.SubjectRepo;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.zSample.Services.CommonService;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class SubjectService {

    private final AcademicCommonService academicCommonService;
    private final SubjectRepo subjectRepo;
    private final TeacherCommonService teacherCommonService;
    private final SubjectCommonService subjectCommonService;
    private final AuthorizationService authorizationService;
    private final CommonService commonService;

    public @Nullable List<SubjectResponse> getAll() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.SUBJECT);

        Set<Long> longs = map.keySet();

        List<Subject> allById = subjectRepo.findAllById(longs);

        return allById.stream()
                .map(subject -> subject.mapToResponse(authorizationService.getPermissionAction(ResourceType.SUBJECT, subject.getId())))
                .toList();
    }

    public @Nullable SubjectResponse create(Long courseId, CommonRequest request) {
        Course course = academicCommonService.getCourse(courseId);

        Subject saved = subjectRepo.save(
                Subject.builder()
                        .name(request.getName())
                        .code(course.getCode() + request.getCode())
                        .course(course)
                        .build()
        );

        authorizationService.createPermission(saved.getId(), ResourceType.SUBJECT, courseId, ResourceType.COURSE);

        return saved.mapToResponse(authorizationService.getPermissionAction(ResourceType.SUBJECT, saved.getId()));
    }

    public @Nullable SubjectResponse update(SubjectRequest subjectRequest) {
        Subject subject = subjectCommonService.getSubject(subjectRequest.getId());
        return handleUpdate(subject,subjectRequest).mapToResponse(authorizationService.getPermissionAction(ResourceType.SUBJECT, subject.getId()));
    }

    public @Nullable String delete(Long subjectId) {
        Subject subject = subjectCommonService.getSubject(subjectId);
        try {
            subjectRepo.delete(subject);
            authorizationService.deletePermission(ResourceType.SUBJECT, subject.getId());
        } catch (Exception e) {
            throw new OperationNotAllowedException("You can't delete this Subject because " + e.getMessage());
        }
        return "Deleted Successfully";
    }


    private Subject handleUpdate(Subject subject, SubjectRequest subjectRequest) {

        subject.setName(subjectRequest.getName());
        subject.setCodeWithPrefix(subjectRequest.getCode());

        if (subjectRequest.getActiveStatus() != subject.getActiveStatus()) {
            subject = academicCommonService.handleActiveStatusUpdate(
                    subject,
                    subjectRequest.getActiveStatus()
            );
        }

        subject.setIsPracticalSubject(subjectRequest.getIsPracticalSubject());
        subject.setLecturesPerWeek(subjectRequest.getLecturesPerWeek());

        subject.setSpecializations(
                academicCommonService.getSpecialization(
                        subjectRequest.getSpecializationsId()
                )
        );

        // Question bank teacher
        Long requestedQuestionBankTeacherId =
                subjectRequest.getQuestionBankTeacherId();

        Long existingQuestionBankTeacherId =
                subject.getQuestionBankTeacher() == null
                        ? null
                        : subject.getQuestionBankTeacher().getId();

        if (!java.util.Objects.equals(
                existingQuestionBankTeacherId,
                requestedQuestionBankTeacherId
        )) {
            subject.setQuestionBankTeacher(
                    requestedQuestionBankTeacherId == null
                            ? null
                            : teacherCommonService.getTeacher(
                            requestedQuestionBankTeacherId
                    )
            );
        }

        subject.setLastDateQuestionBankSummit(
                subjectRequest.getLastDateQuestionBankSummit()
        );

        // Study material teacher
        Long requestedStudyMaterialTeacherId =
                subjectRequest.getStudyMaterialTeacherId();

        Long existingStudyMaterialTeacherId =
                subject.getStudyMaterialTeacher() == null
                        ? null
                        : subject.getStudyMaterialTeacher().getId();

        if (!java.util.Objects.equals(
                existingStudyMaterialTeacherId,
                requestedStudyMaterialTeacherId
        )) {
            subject.setStudyMaterialTeacher(
                    requestedStudyMaterialTeacherId == null
                            ? null
                            : teacherCommonService.getTeacher(
                            requestedStudyMaterialTeacherId
                    )
            );
        }

        subject.setLastDateStudyMaterialSummit(
                subjectRequest.getLastDateStudyMaterialSummit()
        );

        return subject;
    }

    public String getPrefix(Long courseId) {
        return academicCommonService.getCourse(courseId).getCode();
    }

    public List<CommonDTO> getTeacherFilter(Long subjectId) {
        return subjectCommonService.getSubject(subjectId)
                .getSubjectTeachers().stream()
                .filter(java.util.Objects::nonNull)
                .map(teacherEnrollment ->
                        teacherEnrollment.getTeacher() != null
                                ? teacherEnrollment.getTeacher().toCommonDTO()
                                : null
                ).toList();
    }
}
