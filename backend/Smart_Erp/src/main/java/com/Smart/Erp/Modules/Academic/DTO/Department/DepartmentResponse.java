package com.Smart.Erp.Modules.Academic.DTO.Department;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DepartmentResponse {
    private Long id;
    private String name;
    private String code;
    private ActiveStatus activeStatus;
    private List<CommonDTO> academicYears;
    private CommonDTO school;
    private CommonDTO university;
    List<PermissionAction> permissionActions;
}
