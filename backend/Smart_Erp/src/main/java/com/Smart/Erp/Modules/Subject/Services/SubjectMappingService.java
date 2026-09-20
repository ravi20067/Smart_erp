package com.Smart.Erp.Modules.Subject.Services;

import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Subject.DTO.Subject.SubjectResponse;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class SubjectMappingService {
    private final TeacherCommonService teacherCommonService;

    public SubjectResponse mapToResponse(Subject subject) {
        return SubjectResponse.builder()
                .id(subject.getId())
                .name(subject.getName())
                .code(subject.getCode())
                .activeStatus(subject.getActiveStatus())
                .lecturesPerWeek(subject.getLecturesPerWeek())
                .isPracticalSubject(subject.getIsPracticalSubject())
                .specializations(subject.getSpecializations().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .questionBankTeacher(teacherCommonService.mapToCommon(subject.getQuestionBankTeacher()))
                .studyMaterialTeacher(teacherCommonService.mapToCommon(subject.getStudyMaterialTeacher()))
                .subjectTeachers(subject.getSubjectTeachers().stream()
                        .map(teacherEnrollment -> teacherCommonService.mapToCommon(teacherEnrollment.getTeacher()))
                        .toList()
                )
                .lastDateQuestionBankSummit(subject.getLastDateQuestionBankSummit())
                .lastDateStudyMaterialSummit(subject.getLastDateStudyMaterialSummit())
                .build();
    }
}
