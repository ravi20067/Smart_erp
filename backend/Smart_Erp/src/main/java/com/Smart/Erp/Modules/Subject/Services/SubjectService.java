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
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SubjectService {

    private final AcademicCommonService academicCommonService;
    private final SubjectMappingService mappingService;
    private final SubjectRepo subjectRepo;
    private final TeacherCommonService teacherCommonService;
    private final SubjectCommonService subjectCommonService;

    public @Nullable List<SubjectResponse> getAll(Long academicYearId, Long schoolId, Long departmentId, Long courseId) {
        if (courseId != null) {
            return
                    academicCommonService.getCourse(courseId).getSubjects().stream()
                            .map(mappingService::mapToResponse)
                            .toList();
        } else if (departmentId != null) {
            return academicCommonService.getDepartment(departmentId).getCourses().stream()
                    .flatMap(course -> course.getSubjects().stream())
                    .map(mappingService::mapToResponse)
                    .toList();
        } else if (schoolId != null) {
            return academicCommonService.getSchool(schoolId).getDepartments().stream()
                    .flatMap(department -> department.getCourses().stream())
                    .flatMap(course -> course.getSubjects().stream())
                    .map(mappingService::mapToResponse)
                    .toList();
        } else {
            return academicCommonService.getAcademicYear(academicYearId).getSchools().stream()
                    .flatMap(school -> school.getDepartments().stream())
                    .flatMap(department -> department.getCourses().stream())
                    .flatMap(course -> course.getSubjects().stream())
                    .map(mappingService::mapToResponse)
                    .toList();
        }
    }

    public @Nullable SubjectResponse create(Long courseId, CommonRequest request) {
        Course course = academicCommonService.getCourse(courseId);
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
        Subject subject = validate(subjectCommonService.getSubject(subjectRequest.getId()),courseId);

        return mappingService.mapToResponse(handleUpdate(subject,subjectRequest));
    }

    public @Nullable String delete(Long courseId, Long subjectId) {
        Subject subject = validate(subjectCommonService.getSubject(subjectId),courseId);
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
}
