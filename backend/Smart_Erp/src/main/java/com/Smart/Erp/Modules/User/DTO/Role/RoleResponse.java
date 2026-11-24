package com.Smart.Erp.Modules.User.DTO.Role;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Getter
@SuperBuilder
public class RoleResponse extends BaseDTO {
    private Long id;
    private String name;
    private String description;
    private UserRoleEnumResponse userRole;
    private Boolean active;
    private int userCount;
    private CommonDTO university;
    private List<RolePermissionResponse> permissions;
    private List<PermissionAction> permissionActions;
}