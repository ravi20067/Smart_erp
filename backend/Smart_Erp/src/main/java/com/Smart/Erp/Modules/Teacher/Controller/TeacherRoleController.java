package com.Smart.Erp.Modules.Teacher.Controller;


import com.Smart.Erp.Modules.Teacher.DTO.Role.RoleFilter;
import com.Smart.Erp.Modules.Teacher.DTO.Role.UserRoleResponse;
import com.Smart.Erp.Modules.Teacher.Services.TeacherRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:head-of-department|admin|dean|super-admin}/teacher-role")
@RequiredArgsConstructor
public class TeacherRoleController {

    private final TeacherRoleService teacherRoleService;

    @GetMapping("/get-roles")
    public ResponseEntity<List<UserRoleResponse>> getTeacherRoles(@RequestParam(required = false) Long teacherId) {
        List<UserRoleResponse> response = teacherRoleService.getTeacherRoles(teacherId);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).TEACHER, " +
                    "#teacherId)"
    )
    @PutMapping("/add-role")
    public ResponseEntity<UserRoleResponse> addRoleToTeacher(
            @RequestParam Long teacherId, @RequestParam Long roleId) {
        UserRoleResponse userRoleResponse = teacherRoleService.updateTeacherRole(teacherId, roleId);
        return ResponseEntity.ok(userRoleResponse);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).TEACHER, " +
                    "#teacherId)"
    )
    @PutMapping("/change-active-status")
    public ResponseEntity<UserRoleResponse> changeActiveStatus(
            @RequestParam Long teacherId,
            @RequestParam Long userRoleId,
            @RequestParam Boolean status
    ){
        UserRoleResponse userRoleResponse = teacherRoleService.changeActiveStatus(teacherId, userRoleId, status);
        return ResponseEntity.ok(userRoleResponse);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).TEACHER, " +
                    "#teacherId)"
    )
    @GetMapping("/get-role-filter")
    public ResponseEntity<List<RoleFilter>> getRoleFilter(@RequestParam Long teacherId) {
        List<RoleFilter> response = teacherRoleService.getRoleFilter(teacherId);
        return ResponseEntity.ok(response);
    }

}
