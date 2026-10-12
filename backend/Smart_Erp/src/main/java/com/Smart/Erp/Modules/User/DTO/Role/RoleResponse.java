package com.Smart.Erp.Modules.User.DTO.Role;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RoleResponse {
    private Long id;
    private String name;
    private String description;
    private UserRoles userRole;
    private Boolean active ;
    private int userCount;
    private CommonDTO university;
    private List<PermissionAction> permissions;
}
