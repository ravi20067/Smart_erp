package com.Smart.Erp.Modules.User.Services;


import com.Smart.Erp.Modules.User.Entity.*;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Repo.PermissionRepo;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthorizationService {

    private final UserRepo userRepository;
    private final UserRoleRepo userRoleRepository;
    private final PermissionRepo permissionRepository;

    private final ResourceAuthorizationService
            resourceAuthorizationService;


    public boolean can(
            Authentication authentication,
            PermissionAction action,
            ResourceType resourceType,
            Long resourceId
    ) {
        // -----------------------------------------
        // 1. Authentication check
        // -----------------------------------------
        if (authentication == null) {
            return false;
        }

        if (!authentication.isAuthenticated()) {
            return false;
        }

        // -----------------------------------------
        // 2. Get username
        // -----------------------------------------

        String username = authentication.getName();

        if (username == null || username.isBlank()) {
            return false;
        }


        // -----------------------------------------
        // 3. Load user
        // -----------------------------------------

        User user = userRepository
                .findByUsername(username)
                .orElse(null);

        if (user == null) {
            return false;
        }


        // -----------------------------------------
        // 4. User must be enabled
        // -----------------------------------------

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            return false;
        }

        // -----------------------------------------
        // 6. Find permission
        // -----------------------------------------
        Permission requestedPermission =
                permissionRepository
                        .findByResourceTypeAndAction(
                                resourceType,
                                action
                        )
                        .orElse(null);

        if (requestedPermission == null) {
            return false;
        }


        // -----------------------------------------
        // 7. Permission must be active
        // -----------------------------------------
        if (!Boolean.TRUE.equals(
                requestedPermission.getActive()
        )) {
            return false;
        }


        // -----------------------------------------
        // 8. Check user's roles
        // -----------------------------------------

        return userRoleRepository
                .findAllActiveByUserId(user.getId())
                .stream()
                .anyMatch(
                        userRole ->
                                roleHasPermission(
                                        userRole.getRole(),
                                        requestedPermission
                                )
                );
    }


    /**
     * Checks whether a role contains the requested
     * permission directly or through its parent
     * permission hierarchy.
     */
    private boolean roleHasPermission(
            Role role,
            Permission requestedPermission
    ) {

        if (role == null) {
            return false;
        }

        if (!Boolean.TRUE.equals(role.getActive())) {
            return false;
        }


        // -----------------------------------------
        // Check role's permissions
        // -----------------------------------------

        for (RolePermission rolePermission :
                role.getPermissions()) {

            if (!Boolean.TRUE.equals(
                    rolePermission.getActive()
            )) {
                continue;
            }

            Permission grantedPermission =
                    rolePermission.getPermission();

            if (grantedPermission == null) {
                continue;
            }

            if (!Boolean.TRUE.equals(
                    grantedPermission.getActive()
            )) {
                continue;
            }


            // Exact permission
            if (isSamePermission(
                    grantedPermission,
                    requestedPermission
            )) {
                return true;
            }


            // Parent permission grants child permission
            if (isParentPermission(
                    grantedPermission,
                    requestedPermission
            )) {
                return true;
            }
        }

        return false;
    }


    /**
     * Exact permission comparison.
     */
    private boolean isSamePermission(
            Permission granted,
            Permission requested
    ) {

        return granted.getId()
                .equals(requested.getId());
    }


    /**
     * Checks whether the granted permission is an
     * ancestor of the requested permission.
     *
     * Example:
     *
     * COURSE
     *   └── COURSE.UPDATE
     *
     * If role has COURSE,
     * COURSE.UPDATE can be allowed.
     */
    private boolean isParentPermission(
            Permission granted,
            Permission requested
    ) {

        Permission current =
                requested.getParent();

        while (current != null) {

            if (current.getId()
                    .equals(granted.getId())) {

                return true;
            }

            current = current.getParent();
        }

        return false;
    }
}
