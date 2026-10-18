package com.Smart.Erp.Modules.User.DTO.Role;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.User.Entity.Permission;
import com.Smart.Erp.Modules.User.Entity.User;
import lombok.Builder;
import lombok.Data;


@Builder
@Data
public class RolePermissionResponse {
    private Permission permission;
    private CommonDTO assignedBy;
    private Boolean active ;
}
