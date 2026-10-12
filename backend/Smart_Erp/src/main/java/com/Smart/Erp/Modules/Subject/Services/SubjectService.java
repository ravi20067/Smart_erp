package com.Smart.Erp.Modules.Subject.Services;

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

    private Subject handleUpdate(Subject subject, SubjectRequest subjectRequest){
        subject.setName(subjectRequest.getName());
        subject.setCodeWithPrefix(subjectRequest.getCode());
        if (subjectRequest.getActiveStatus() != subject.getActiveStatus()){
            subject = academicCommonService.handleActiveStatusUpdate(subject,subjectRequest.getActiveStatus());
        }

        subject.setIsPracticalSubject(subjectRequest.getIsPracticalSubject());
        subject.setLecturesPerWeek(subjectRequest.getLecturesPerWeek());


        subject.setSpecializations(academicCommonService.getSpecialization(subjectRequest.getSpecializationsId()));

        if (subject.getQuestionBankTeacher() == null || !subject.getQuestionBankTeacher().getId().equals(subjectRequest.getQuestionBankTeacherId())){
            subject.setQuestionBankTeacher(teacherCommonService.getTeacher(subjectRequest.getQuestionBankTeacherId()));
        }
        subject.setLastDateQuestionBankSummit(subjectRequest.getLastDateQuestionBankSummit());

        if (subject.getStudyMaterialTeacher() == null || !subject.getStudyMaterialTeacher().getId().equals(subjectRequest.getStudyMaterialTeacherId())){
            subject.setStudyMaterialTeacher(teacherCommonService.getTeacher(subjectRequest.getQuestionBankTeacherId()));
        }
        subject.setLastDateStudyMaterialSummit(subjectRequest.getLastDateStudyMaterialSummit());

        return subject;
    }

    public String getPrefix(Long courseId) {
        return academicCommonService.getCourse(courseId).getCode();
    }
}
