package com.Smart.Erp.Modules.Academic.DTO.School;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SchoolResponse {
    private Long id;
    private String name;
    private ActiveStatus activeStatus;
    private String code;
    private List<CommonDTO> departments;
    private List<PermissionAction> permissionActions;
    private CommonDTO university;
}
