package com.Smart.Erp.Modules.Subject.DTO.Subject;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.List;

@Getter
@SuperBuilder
public class SubjectResponse extends BaseDTO {

    private Long id;
    private String name;
    private String code;

    private Integer lecturesPerWeek;
    private Boolean isPracticalSubject;

    private List<CommonDTO> specializations;

    private ActiveStatus activeStatus;

    private List<CommonDTO> subjectTeachers;

    private CommonDTO course;

    private CommonDTO department;

    private CommonDTO school;

    private CommonDTO university;

    private List<PermissionAction> permissionActions;
}
