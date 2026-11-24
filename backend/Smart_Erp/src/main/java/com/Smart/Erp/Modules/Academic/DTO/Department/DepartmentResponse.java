package com.Smart.Erp.Modules.Academic.DTO.Department;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Getter
@SuperBuilder
public class DepartmentResponse extends BaseDTO {
    private Long id;
    private String name;
    private String code;
    private ActiveStatus activeStatus;
    private List<CommonDTO> courses;
    private CommonDTO school;
    private CommonDTO university;
    private List<PermissionAction> permissionActions;
}
