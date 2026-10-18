package com.Smart.Erp.Modules.User.DTO.Role;

import com.Smart.Erp.Modules.User.Enum.UserRoles;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class UserRoleEnumResponse {
    private String name;
    private UserRoles enumValue;//for sending enum value to frontend and frontend to backend
}
