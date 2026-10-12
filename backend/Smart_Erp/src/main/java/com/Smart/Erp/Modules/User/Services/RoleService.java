package com.Smart.Erp.Modules.User.Services;

import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.DTO.School.SchoolResponse;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.Academic.Services.AcademicYearService;
import com.Smart.Erp.Modules.User.DTO.Role.RoleRequest;
import com.Smart.Erp.Modules.User.DTO.Role.RoleResponse;
import com.Smart.Erp.Modules.User.Entity.Role;
import com.Smart.Erp.Modules.User.Entity.UserRole;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Repo.RoleRepo;
import com.Smart.Erp.Modules.zSample.Services.CommonService;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepo roleRepo;
    private final UserCommonService userCommonService;
    private final AcademicCommonService academicCommonService;
    private final AuthorizationService authorizationService;
    private final CommonService commonService;

    public List<RoleResponse> getRoles() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.ROLE);
        List<Role> roles = roleRepo.findAllById(map.keySet());
        return roles.stream()
                .distinct()
                .map(role -> role.mapToResponse(authorizationService.getPermissionAction(ResourceType.STUDENT, role.getId())))
                .toList();
    }

    public RoleResponse createRole(Long universityId, RoleRequest request) {
        Role saved = roleRepo.save(
                Role.builder()
                        .name(request.getName())
                        .description(request.getDescription())
                        .userRole(request.getUserRole())
                        .university(academicCommonService.getUniversity(universityId))
                        .build()
        );

        authorizationService.createPermission(
                saved.getId(),
                ResourceType.ROLE,
                universityId,
                ResourceType.UNIVERSITY
        );

        return saved.mapToResponse(authorizationService.getPermissionAction(ResourceType.ROLE, saved.getId()));
    }

    public RoleResponse updateRole(Long roleId, RoleRequest roleRequest) {

        Role role = userCommonService.getRole(roleId);
        role.setName(roleRequest.getName());
        role.setDescription(roleRequest.getDescription());
        role.setActive(roleRequest.getActive());

        if (role.getUserRole() != roleRequest.getUserRole()) {
            role.setUserRole(roleRequest.getUserRole());
            userCommonService.handleRoleUserRoleEnumChange(role);
        }

        return roleRepo.save(role).mapToResponse(authorizationService.getPermissionAction(ResourceType.ROLE, role.getId()));
    }

    public String deleteRole(Long roleId) {
        if (userCommonService.getRole(roleId).getUsers().isEmpty()) {
            authorizationService.deletePermission(ResourceType.ROLE, roleId);
            roleRepo.deleteById(roleId);
            return "Role deleted successfully";
        } else {
            throw new OperationNotAllowedException("Role is assigned to users, cannot delete");
        }
    }

    public List<String> getRolesEnum() {
        return Arrays.stream(UserRoles.values())
                .map(UserRoles::name)
                .toList();
    }
}
