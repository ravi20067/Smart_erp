package com.Smart.Erp.Modules.Subject.DTO.Subject;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class SubjectResponse {

    private Long id;
    private String name;
    private String code;

    private Integer lecturesPerWeek;
    private Boolean isPracticalSubject;

    private List<CommonDTO> specializations;

    private ActiveStatus activeStatus;

    private CommonDTO questionBankTeacher;
    private CommonDTO studyMaterialTeacher;
    private List<CommonDTO> subjectTeachers;

    private LocalDate lastDateQuestionBankSummit;
    private LocalDate lastDateStudyMaterialSummit;

    private CommonDTO course;
    private CommonDTO academicYear;

    private CommonDTO department;

    private CommonDTO school;

    private CommonDTO university;

    private List<PermissionAction> permissionActions;
}
