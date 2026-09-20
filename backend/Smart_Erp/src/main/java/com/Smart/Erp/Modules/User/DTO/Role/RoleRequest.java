package com.Smart.Erp.Modules.User.DTO.Role;

import com.Smart.Erp.Modules.User.Enum.UserRoles;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class RoleRequest {
    private String name;
    private String description;
    private UserRoles userRole;
    private Boolean active ;
}
