package com.Smart.Erp.Modules.Academic.DTO.AcademicYear;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.DTO.School.SchoolResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Builder
@Data
public class AcademicYearResponse {
    private Long id;
    private String name;
    private String code;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean current = false;
    private ActiveStatus activeStatus;
    private List<CommonDTO> courses;
    private CommonDTO department;
    private CommonDTO school;
    private CommonDTO university;
    private List<PermissionAction> permissionActions;
}
