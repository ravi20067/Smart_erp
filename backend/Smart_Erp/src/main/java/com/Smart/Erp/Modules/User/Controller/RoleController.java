package com.Smart.Erp.Modules.User.Controller;

import com.Smart.Erp.Modules.User.DTO.Role.RoleRequest;
import com.Smart.Erp.Modules.User.DTO.Role.RoleResponse;
import com.Smart.Erp.Modules.User.DTO.Role.UserRoleEnumResponse;
import com.Smart.Erp.Modules.User.Services.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:head-of-department|admin|school-dean|dean|super-admin}/user/role")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public ResponseEntity<List<RoleResponse>> getRoles() {
        return ResponseEntity.ok(roleService.getRoles());
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).UNIVERSITY, " +
            "#universityId)")
    @PostMapping
    public ResponseEntity<RoleResponse> createRoles(
            @RequestParam Long universityId,
            @RequestBody RoleRequest request
    ) {
        return ResponseEntity.ok(roleService.createRole(universityId, request));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ROLE, " +
            "#roleId)")
    @PutMapping
    public ResponseEntity<RoleResponse> updateRole(
            @RequestParam Long roleId,
            @RequestBody RoleRequest roleRequest
    ) {
        return ResponseEntity.ok(roleService.updateRole(roleId, roleRequest));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ROLE, " +
            "#roleId)")
    @DeleteMapping
    public ResponseEntity<String> deleteRole(
            @RequestParam Long roleId
    ) {
        return ResponseEntity.ok(
                roleService.deleteRole(
                        roleId
                )
        );
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).UNIVERSITY, " +
            "#universityId)")
    @GetMapping("/enums")
    public ResponseEntity<List<UserRoleEnumResponse>> getRolesEnum(
            @RequestParam Long universityId
    ) {
        return ResponseEntity.ok(roleService.getRolesEnum());
    }
}
