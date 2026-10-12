package com.Smart.Erp.Security;

import com.Smart.Erp.Modules.User.Entity.*;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Repo.PermissionRepo;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service("authVerifier")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthorizationService {

    private final UserRepo userRepository;
    private final PermissionRepo permissionRepository;

    public boolean can(PermissionAction action, ResourceType resourceType, Long resourceId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String username = authentication.getName();
        if (username == null || username.isBlank()) {
            return false;
        }

        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null || !Boolean.TRUE.equals(user.getEnabled()) || user.getUserRole() == null) {
            return false;
        }

        if (user.getUserRole() == UserRoles.SUPER_ADMIN) {
            return true;
        }

        Permission requestedPermission = permissionRepository.findByResourceTypeAndActionAndResourceId(resourceType, action, resourceId).orElse(null);

        if (requestedPermission == null) {
            return false;
        }

        Set<Long> requestedPermissionIds = new HashSet<>();

        while (requestedPermission != null) {
            requestedPermissionIds.add(requestedPermission.getId());
            requestedPermission = requestedPermission.getParent();
        }
        return user.getRoles().stream()
                .filter(UserRole::getActive)
                .map(UserRole::getRole)
                .filter(Role::getActive)
                .flatMap(role -> role.getPermissions().stream())
                .filter(RolePermission::getActive)
                .map(RolePermission::getPermission)
                .anyMatch(permission ->
                        permission != null &&
                                requestedPermissionIds.contains(permission.getId())
                )
                ||
                user.getExtraPermissions().stream()
                        .filter(grant ->
                                grant.isCurrentlyActive(LocalDateTime.now())
                        )
                        .map(UserPermissionGrant::getPermission)
                        .anyMatch(permission ->
                                permission != null &&
                                        requestedPermissionIds.contains(permission.getId())
                        );
    }

    public Map<Long, List<PermissionAction>> getAll(ResourceType resourceType) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return Collections.emptyMap();
        }

        String username = authentication.getName();
        if (username == null || username.isBlank()) {
            return Collections.emptyMap();
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getEnabled()) || user.getUserRole() == null) {
            return Collections.emptyMap();
        }
        HashMap<Long, List<PermissionAction>> map = new HashMap<>();

        if (user.getUserRole() == UserRoles.SUPER_ADMIN) {
            permissionRepository.findByResourceType(resourceType)
                    .forEach(permission -> {
                        List<PermissionAction> actions = map.computeIfAbsent(
                                permission.getResourceId(),
                                k -> new ArrayList<>()
                        );
                        // Add permission action if it does not exist
                        if (!actions.contains(permission.getAction())) {
                            actions.add(permission.getAction());
                        }
                    });
            return map;
        }

        user.getRoles().stream()
                .filter(UserRole::getActive)
                .map(UserRole::getRole)
                .filter(Role::getActive)
                .flatMap(role -> role.getPermissions().stream())
                .filter(RolePermission::getActive)
                .map(RolePermission::getPermission)
                .forEach(permission ->
                        getAll(resourceType, permission, map)
                );
        return map;
    }

    private void getAll(
            ResourceType resourceType,
            Permission permission,
            Map<Long, List<PermissionAction>> map
    ) {
        if (permission == null) {
            return;
        }

        if (!permission.getResourceType().isAncestorOf(resourceType)) {
            return;
        }

        if (resourceType == permission.getResourceType()) {
            List<PermissionAction> actions = map.computeIfAbsent(
                    permission.getResourceId(),
                    k -> new ArrayList<>()
            );

            // Add permission action if it does not exist
            if (!actions.contains(permission.getAction())) {
                actions.add(permission.getAction());
            }
            return;
        }

        permission.getChildren()
                .forEach(
                        child -> getAll(resourceType, child, map)
                );
    }

    public void createPermission(
            Long childResourceId,
            ResourceType childResourceType,
            Long parentResourceId,
            ResourceType parentResourceType
    ) {

        List<Permission> parentPermission = permissionRepository.findByResourceTypeAndResourceId(parentResourceType, parentResourceId);

        parentPermission.
                forEach(
                        permission ->
                                permission.addChildren(
                                        Permission.builder()
                                                .resourceType(childResourceType)
                                                .resourceId(childResourceId)
                                                .action(permission.getAction())
                                                .build()
                                )
                );
        permissionRepository.saveAll(parentPermission);
    }

    public void createPermission(
            Long resourceId,
            ResourceType resourceType
    ){
        List<Permission> permissions = new ArrayList<>();

        for (PermissionAction permissionAction : PermissionAction.values()){
            permissions.add(
                    Permission.builder()
                            .resourceType(resourceType)
                            .resourceId(resourceId)
                            .action(permissionAction)
                            .build()
            );
        }

        permissionRepository.saveAll(permissions);
    }

    public void deletePermission(
            ResourceType resourceType,
            Long resourceId
    ) {
        Permission permission = permissionRepository
                .findByResourceTypeAndResourceId(resourceType, resourceId)
                .stream()
                .findFirst()
                .orElse(null);

        if (permission == null) {
            return;
        }
        permissionRepository.delete(permission);
    }

    public List<PermissionAction> getPermissionAction(
            ResourceType resourceType,
            Long resourceId
    ) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return Collections.emptyList();
        }

        String username = authentication.getName();

        if (username == null || username.isBlank()) {
            return Collections.emptyList();
        }

        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null
                || !Boolean.TRUE.equals(user.getEnabled())
                || user.getUserRole() == null) {
            return Collections.emptyList();
        }

        // SUPER ADMIN has every action
        if (user.getUserRole() == UserRoles.SUPER_ADMIN) {
            return new ArrayList<>(
                    Arrays.asList(PermissionAction.values())
            );
        }

        /*
         * All permission nodes belonging to the requested resource.
         *
         * Example:
         * SCHOOL 10
         *   ├── READ
         *   ├── UPDATE
         *   ├── DELETE
         *   └── CREATE_CHILD
         */
        List<Permission> requestedPermissions =
                permissionRepository
                        .findByResourceTypeAndResourceId(
                                resourceType,
                                resourceId
                        );

        if (requestedPermissions.isEmpty()) {
            return Collections.emptyList();
        }
        /*
         * Collect all permission IDs from the requested resource
         * and its parent chain.
         */
        Set<Long> validPermissionIds = new HashSet<>();

        for (Permission permission : requestedPermissions) {

            Permission current = permission;

            while (current != null) {
                validPermissionIds.add(current.getId());
                current = current.getParent();
            }
        }
        /*
         * Check which of those permissions are actually assigned
         * to the current user.
         */
        return user.getRoles().stream()
                .filter(UserRole::getActive)
                .map(UserRole::getRole)
                .filter(Role::getActive)
                .flatMap(role -> role.getPermissions().stream())
                .filter(RolePermission::getActive)
                .map(RolePermission::getPermission)
                .filter(Objects::nonNull)
                .filter(permission ->
                        validPermissionIds.contains(permission.getId())
                )
                .map(Permission::getAction)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    public void changeParent(
            Long childResourceId,
            ResourceType childResourceType,
            Long parentResourceId,
            ResourceType parentResourceType
    ){
        deletePermission(childResourceType, childResourceId);
        createPermission(childResourceId, childResourceType, parentResourceId, parentResourceType);
    }
}