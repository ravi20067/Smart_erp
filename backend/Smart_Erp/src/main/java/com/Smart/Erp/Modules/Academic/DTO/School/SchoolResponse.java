package com.Smart.Erp.Modules.Academic.DTO.School;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Getter
@SuperBuilder
public class SchoolResponse extends BaseDTO {
    private Long id;
    private String name;
    private ActiveStatus activeStatus;
    private String code;
    private List<CommonDTO> departments;
    private List<PermissionAction> permissionActions;
    private CommonDTO university;
}
