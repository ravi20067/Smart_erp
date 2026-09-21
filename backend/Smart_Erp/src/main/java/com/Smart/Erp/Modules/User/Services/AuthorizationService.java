package com.Smart.Erp.Modules.User.Services;

import com.Smart.Erp.Modules.User.Entity.*;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Repo.PermissionRepo;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Component("authVerifier")
public class AuthorizationService {

    private final UserRepo userRepository;
    private final PermissionRepo permissionRepository;

    public boolean can(
            PermissionAction action,
            ResourceType resourceType,
            Long resourceId
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // -----------------------------------------
        // 1 & 2. Authentication check
        // -----------------------------------------
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String username = authentication.getName();
        if (username == null || username.isBlank()) {
            return false;
        }

        // -----------------------------------------
        // 3 & 4. Load user and check status
        // -----------------------------------------
        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null || !Boolean.TRUE.equals(user.getEnabled()) ||  user.getUserRole() == null) {
            return false;
        }

        if (user.getUserRole() == UserRoles.SUPER_ADMIN){
            return true;
        }

        // -----------------------------------------
        // 5. Find requested permission
        // -----------------------------------------
        Permission requestedPermission = permissionRepository
                .findByResourceTypeAndActionAndResourceId(resourceType, action, resourceId)
                .orElse(null);

        if (requestedPermission == null) {
            return false;
        }

        // -----------------------------------------
        // 6. Build Hierarchy (Optimized to HashSet)
        // -----------------------------------------
        Set<Long> requestedPermissionIds = new HashSet<>();
        while (requestedPermission != null) {
            requestedPermissionIds.add(requestedPermission.getId());
            requestedPermission = requestedPermission.getParent(); // Note: Can trigger N+1 query if Parent is Lazy loaded
        }

        // -----------------------------------------
        // 7. Final Matching (Optimized with anyMatch)
        // -----------------------------------------
        return user.getRoles().stream()
                .filter(UserRole::getActive)
                .map(UserRole::getRole)
                .filter(Role::getActive)
                .flatMap(role -> role.getPermissions().stream())
                .filter(RolePermission::getActive)
                .map(RolePermission::getPermission)
                // anyMatch will instantly stop and return true on the first match (O(1) best case)
                .anyMatch(permission ->
                        permission != null && requestedPermissionIds.contains(permission.getId())
                );
    }

    public List<Long> getAll(
            ResourceType resourceType
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // -----------------------------------------
        // 1 & 2. Authentication check
        // -----------------------------------------
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ArrayList<>();
        }

        String username = authentication.getName();
        if (username == null || username.isBlank()) {
            return new ArrayList<>();
        }

        // -----------------------------------------
        // 3 & 4. Load user and check status
        // -----------------------------------------
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getEnabled()) ||  user.getUserRole() == null) {
            return new ArrayList<>();
        }
    }
}