package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.Admin.Department.DepartmentRequest;
import com.Smart.Erp.DTO.Admin.Subject.SubjectRequest;
import com.Smart.Erp.DTO.Admin.Subject.SubjectResponse;
import com.Smart.Erp.DTO.CommonRequest;
import com.Smart.Erp.Entity.Course;
import com.Smart.Erp.Entity.Specialization;
import com.Smart.Erp.Entity.Subject;
import com.Smart.Erp.Entity.Teacher;
import com.Smart.Erp.Exception.OperationNotAllowedException;
import com.Smart.Erp.Repository.SubjectRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SubjectService {

    private final CommonService commonService;
    private final MappingService mappingService;
    private final SubjectRepo subjectRepo;

    public @Nullable List<SubjectResponse> getAll(Long courseId) {
        return commonService.getCourse(courseId).getSubjects().stream()
                .map(mappingService::mapToResponse)
                .toList();
    }

    public @Nullable SubjectResponse getById(Long courseId, Long subjectId) {
        return mappingService.mapToResponse(validate(commonService.getSubject(subjectId),courseId));
    }

    public @Nullable SubjectResponse create(Long courseId, CommonRequest request) {
        Course course = commonService.getCourse(courseId);
        return mappingService.mapToResponse(
                subjectRepo.save(
                        Subject.builder()
                                .name(request.getName())
                                .code(request.getCode())
                                .course(course)
                                .build()
                )
        );
    }

    public @Nullable SubjectResponse update(Long courseId, SubjectRequest subjectRequest) {
        Subject subject = validate(commonService.getSubject(subjectRequest.getId()),courseId);

        return mappingService.mapToResponse(handleUpdate(subject,subjectRequest));
    }

    public @Nullable String delete(Long courseId, Long subjectId) {
        Subject subject = validate(commonService.getSubject(subjectId),courseId);
        try {
            subjectRepo.delete(subject);
        } catch (Exception e) {
            throw new OperationNotAllowedException("You can't delete this Subject because " + e.getMessage());
        }
        return "Deleted Successfully";
    }
    private Subject validate(Subject subject, Long courseId){
        if (subject.getCourse().getId().equals(courseId)){
            return subject;
        } else {
            throw  new OperationNotAllowedException("Course id is not valid");
        }
    }

    private Subject handleUpdate(Subject subject, SubjectRequest subjectRequest){
        subject.setName(subjectRequest.getName());
        subject.setCode(subjectRequest.getCode());

        subject.setIsPracticalSubject(subjectRequest.getIsPracticalSubject());
        subject.setLecturesPerWeek(subjectRequest.getLecturesPerWeek());

        subject.setSpecializations(commonService.getSpecialization(subjectRequest.getSpecializationsId()));

        if (subject.getQuestionBankTeacher() == null || !subject.getQuestionBankTeacher().getId().equals(subjectRequest.getQuestionBankTeacherId())){
            subject.setQuestionBankTeacher(commonService.getTeacher(subjectRequest.getQuestionBankTeacherId()));
        }
        subject.setLastDateQuestionBankSummit(subjectRequest.getLastDateQuestionBankSummit());

        if (subject.getStudyMaterialTeacher() == null || !subject.getStudyMaterialTeacher().getId().equals(subjectRequest.getStudyMaterialTeacherId())){
            subject.setStudyMaterialTeacher(commonService.getTeacher(subjectRequest.getQuestionBankTeacherId()));
        }
        subject.setLastDateStudyMaterialSummit(subjectRequest.getLastDateStudyMaterialSummit());

        return subject;
    }
}
