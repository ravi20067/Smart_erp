package com.Smart.Erp.Modules.Academic.DTO.Courses;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class CourseResponse {
    private Long id;
    private String name;
    private String code;
    private ActiveStatus activeStatus;
    private List<CommonDTO> subjects;
    private List<CommonDTO> sections;
    private List<CommonDTO> specializations;
    private Boolean newEnrollmentAllowed;
    private CommonDTO academicYear;
    private CommonDTO department;
    private CommonDTO school;
    private CommonDTO university;
    private List<PermissionAction> permissionActions;
}
