package com.Smart.Erp.Modules.User.Controller;

import com.Smart.Erp.Modules.User.DTO.Role.RoleRequest;
import com.Smart.Erp.Modules.User.DTO.Role.RoleResponse;
import com.Smart.Erp.Modules.User.Entity.Permission;
import com.Smart.Erp.Modules.User.Services.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:head-of-department|admin|school-dean|dean|super-admin}/user/permission")
@RequiredArgsConstructor
public class PermissionController {

    private final RoleService roleService;

    //It gives the list of all the base permissions that can be assigned to a role. This is used in the frontend to show the list of permissions that can be assigned to a role.
    @GetMapping
    public ResponseEntity<List<Permission>> getRoleBasePermissions() {
        return ResponseEntity.ok(roleService.getRoleBasePermissions());
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ROLE, " +
            "#roleId)")
    @PutMapping
    public ResponseEntity<RoleResponse> updateRolePermissions(
            @RequestParam Long roleId,
            @RequestBody List<Long> permissionIds
            ) {
        return ResponseEntity.ok(roleService.updateRolePermissions(roleId, permissionIds));
    }
}
