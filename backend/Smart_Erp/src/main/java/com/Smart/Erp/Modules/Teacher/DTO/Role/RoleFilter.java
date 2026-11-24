package com.Smart.Erp.Modules.Teacher.DTO.Role;

import com.Smart.Erp.Modules.User.Enum.UserRoles;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleFilter {
    private Long id;
    private String name;
    private String description;
    private UserRoles enumValue;
}
