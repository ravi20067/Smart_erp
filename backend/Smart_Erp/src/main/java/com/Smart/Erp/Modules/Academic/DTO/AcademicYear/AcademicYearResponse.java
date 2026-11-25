package com.Smart.Erp.Modules.Academic.DTO.AcademicYear;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.List;

@Getter
@SuperBuilder
public class AcademicYearResponse extends BaseDTO {
    private Long id;
    private String name;
    private String code;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean current;
    private ActiveStatus activeStatus;
    private CommonDTO university;
    private List<PermissionAction> permissionActions;
}
