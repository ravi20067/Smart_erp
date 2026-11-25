package com.Smart.Erp.Modules.Academic.DTO.Courses;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.List;

@SuperBuilder
@Getter
public class CourseResponse extends BaseDTO {
    private Long id;
    private String name;
    private String code;
    private ActiveStatus activeStatus;
    private List<CommonDTO> subjects;
    private List<CommonDTO> sections;
    private List<CommonDTO> specializations;
    private Boolean newEnrollmentAllowed;
    private CommonDTO department;
    private CommonDTO school;
    private CommonDTO university;
    private List<PermissionAction> permissionActions;
}
