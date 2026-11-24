package com.Smart.Erp.Modules.Teacher.DTO.Role;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
public class TeacherRoleResponse extends BaseDTO {
    private Long id;
    private String name;
    private String description;
    private UserRoles enumValue;
    private Boolean active;
}
