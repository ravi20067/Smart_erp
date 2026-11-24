package com.Smart.Erp.Modules.Teacher.DTO.Role;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleResponse {
    private Long teacherId;
    private CommonDTO user;
    private List<TeacherRoleResponse> roles;
    private List<PermissionAction> permissionActions;
}
