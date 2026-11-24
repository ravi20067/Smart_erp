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
import java.util.stream.Stream;

@Service("authVerifier")
@RequiredArgsConstructor
@Transactional
public class AuthorizationService {

    private final UserRepo userRepository;
    private final PermissionRepo permissionRepository;

    /**
     * Checks the requested action on a resource.
     *
     * A permission granted on an ancestor resource is inherited by the
     * requested resource through the Permission parent chain.
     */
    public boolean can(
            PermissionAction action,
            ResourceType resourceType,
            Long resourceId
    ) {
        if (action == null || resourceType == null || resourceId == null) {
            return false;
        }

        User user = getAuthenticatedEnabledUser();
        if (user == null) {
            return false;
        }

        if (user.getUserRole() == UserRoles.SUPER_ADMIN) {
            return true;
        }

        Permission requestedPermission = permissionRepository
                .findByResourceTypeAndActionAndResourceId(
                        resourceType,
                        action,
                        resourceId
                )
                .orElse(null);

        if (requestedPermission == null) {
            return false;
        }

        Set<Long> requestedPermissionIds = new HashSet<>();

        Permission current = requestedPermission;
        while (current != null) {
            requestedPermissionIds.add(current.getId());
            current = current.getParent();
        }

        return getAssignedPermissions(user)
                .anyMatch(permission ->
                        permission.getId() != null
                                && requestedPermissionIds.contains(permission.getId())
                );
    }

    /**
     * Returns all resources of the requested type which the current user
     * can access, together with the actions inherited/assigned to them.
     *
     * This includes both role permissions and active direct user grants.
     */
    public Map<Long, List<PermissionAction>> getAll(ResourceType resourceType) {
        if (resourceType == null) {
            return Collections.emptyMap();
        }

        User user = getAuthenticatedEnabledUser();
        if (user == null) {
            return Collections.emptyMap();
        }

        Map<Long, List<PermissionAction>> result = new HashMap<>();

        if (user.getUserRole() == UserRoles.SUPER_ADMIN) {
            permissionRepository.findByResourceType(resourceType)
                    .forEach(permission ->
                            addAction(
                                    result,
                                    permission.getResourceId(),
                                    permission.getAction()
                            )
                    );
            return result;
        }

        getAssignedPermissions(user).forEach(permission ->
                collectAccessibleResources(resourceType, permission, result)
        );

        return result;
    }

    /**
     * Traverses the permission tree from an assigned permission down to
     * resources of the requested type.
     */
    private void collectAccessibleResources(
            ResourceType requestedType,
            Permission assignedPermission,
            Map<Long, List<PermissionAction>> result
    ) {
        if (requestedType == null || assignedPermission == null
                || assignedPermission.getResourceType() == null) {
            return;
        }

        ResourceType assignedType = assignedPermission.getResourceType();

        if (!assignedType.isAncestorOf(requestedType)) {
            return;
        }

        if (assignedType == requestedType) {
            addAction(
                    result,
                    assignedPermission.getResourceId(),
                    assignedPermission.getAction()
            );
            return;
        }

        if (assignedPermission.getChildren() == null) {
            return;
        }

        assignedPermission.getChildren().forEach(child ->
                collectAccessibleResources(requestedType, child, result)
        );
    }

    /**
     * Existing child-resource permission creation method.
     *
     * Kept with its original behaviour for compatibility with other modules.
     * New timetable resources use createChildPermission(), which adds
     * validation and idempotency without changing legacy call sites.
     */
    public void createPermission(
            Long childResourceId,
            ResourceType childResourceType,
            Long parentResourceId,
            ResourceType parentResourceType
    ) {
        List<Permission> parentPermissions =
                permissionRepository.findByResourceTypeAndResourceId(
                        parentResourceType,
                        parentResourceId
                );

        parentPermissions.forEach(permission ->
                permission.addChildren(
                        Permission.builder()
                                .resourceType(childResourceType)
                                .resourceId(childResourceId)
                                .action(permission.getAction())
                                .build()
                )
        );

        permissionRepository.saveAll(parentPermissions);
    }

    /**
     * Strict, idempotent child permission creation for new timetable resources.
     * It validates the declared ResourceType parent and fails fast when the
     * parent permission tree has not been initialized.
     */
    public void createChildPermission(
            Long childResourceId,
            ResourceType childResourceType,
            Long parentResourceId,
            ResourceType parentResourceType
    ) {
        if (childResourceId == null || parentResourceId == null
                || childResourceType == null || parentResourceType == null) {
            throw new IllegalArgumentException("Permission resource IDs and types are required.");
        }

        if (childResourceType.getParent() != parentResourceType) {
            throw new IllegalArgumentException(
                    childResourceType + " must be a direct child of " + parentResourceType
            );
        }

        List<Permission> parentPermissions =
                permissionRepository.findByResourceTypeAndResourceId(
                        parentResourceType,
                        parentResourceId
                );

        if (parentPermissions.isEmpty()) {
            throw new IllegalStateException(
                    "Cannot create permission for " + childResourceType
                            + " " + childResourceId
                            + ": parent permission records not found for "
                            + parentResourceType + " " + parentResourceId
            );
        }

        List<Permission> existingChildPermissions =
                permissionRepository.findByResourceTypeAndResourceId(
                        childResourceType,
                        childResourceId
                );

        boolean changed = false;
        Set<PermissionAction> processedActions = new HashSet<>();

        for (Permission parentPermission : parentPermissions) {
            PermissionAction action = parentPermission.getAction();

            if (action == null || !processedActions.add(action)) {
                continue;
            }

            Permission existingForAction = existingChildPermissions.stream()
                    .filter(child -> child.getAction() == action)
                    .findFirst()
                    .orElse(null);

            if (existingForAction != null) {
                if (existingForAction.getParent() == null
                        || !Objects.equals(
                        existingForAction.getParent().getId(),
                        parentPermission.getId()
                )) {
                    throw new IllegalStateException(
                            "Existing permission node has an unexpected parent: "
                                    + childResourceType + " " + childResourceId
                                    + " / " + action
                    );
                }
                continue;
            }

            parentPermission.addChildren(
                    Permission.builder()
                            .resourceType(childResourceType)
                            .resourceId(childResourceId)
                            .action(action)
                            .build()
            );

            changed = true;
        }

        if (changed) {
            permissionRepository.saveAll(parentPermissions);
        }
    }

    /**
     * Existing root permission creation method retained for compatibility
     * with all existing modules and call sites.
     */
    public void createPermission(
            Long resourceId,
            ResourceType resourceType
    ) {
        List<Permission> permissions = new ArrayList<>();

        for (PermissionAction permissionAction : PermissionAction.values()) {
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

    /**
     * Deletes permission records directly associated with a resource.
     * Existing cascade/orphan-removal behaviour is preserved.
     */
    public void deletePermission(
            ResourceType resourceType,
            Long resourceId
    ) {
        List<Permission> permissions = permissionRepository
                .findByResourceTypeAndResourceId(resourceType, resourceId)
                .stream()
                .toList();

        if (permissions.isEmpty()) {
            return;
        }

        permissionRepository.deleteAll(permissions);
    }

    /**
     * Returns the actions actually assigned to the current user for a
     * resource, including inherited ancestor permissions and active
     * extra-permission grants.
     */
    public List<PermissionAction> getPermissionAction(
            ResourceType resourceType,
            Long resourceId
    ) {
        if (resourceType == null || resourceId == null) {
            return Collections.emptyList();
        }

        User user = getAuthenticatedEnabledUser();
        if (user == null) {
            return Collections.emptyList();
        }

        if (user.getUserRole() == UserRoles.SUPER_ADMIN) {
            return new ArrayList<>(Arrays.asList(PermissionAction.values()));
        }

        List<Permission> requestedPermissions =
                permissionRepository.findByResourceTypeAndResourceId(
                        resourceType,
                        resourceId
                );

        if (requestedPermissions.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> validPermissionIds = new HashSet<>();

        for (Permission permission : requestedPermissions) {
            Permission current = permission;

            while (current != null) {
                if (current.getId() != null) {
                    validPermissionIds.add(current.getId());
                }
                current = current.getParent();
            }
        }

        return getAssignedPermissions(user)
                .filter(permission ->
                        permission.getId() != null
                                && validPermissionIds.contains(permission.getId())
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
    ) {
        deletePermission(childResourceType, childResourceId);
        createPermission(
                childResourceId,
                childResourceType,
                parentResourceId,
                parentResourceType
        );
    }

    public List<Permission> getRoleBasePermissions() {
        User user = getAuthenticatedEnabledUser();

        if (user == null) {
            return Collections.emptyList();
        }

        if (user.getUserRole() == UserRoles.SUPER_ADMIN) {
            return permissionRepository.findByResourceType(ResourceType.UNIVERSITY);
        }

        return user.getRoles().stream()
                .filter(UserRole::getActive)
                .map(UserRole::getRole)
                .filter(Objects::nonNull)
                .filter(Role::getActive)
                .flatMap(role -> role.getPermissions() == null
                        ? Stream.empty()
                        : role.getPermissions().stream())
                .filter(RolePermission::getActive)
                .map(RolePermission::getPermission)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    public User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()) {
            return null;
        }

        return userRepository.findByUsername(authentication.getName()).orElse(null);
    }

    private User getAuthenticatedEnabledUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()) {
            return null;
        }

        User user = userRepository.findByUsername(authentication.getName()).orElse(null);

        if (user == null
                || !Boolean.TRUE.equals(user.getEnabled())
                || user.getUserRole() == null) {
            return null;
        }

        return user;
    }

    /**
     * Combines active role permissions and active direct grants.
     */
    private Stream<Permission> getAssignedPermissions(User user) {
        Stream<UserRole> userRoles = user.getRoles() == null
                ? Stream.empty()
                : user.getRoles().stream();

        Stream<Permission> rolePermissions = userRoles
                .filter(UserRole::getActive)
                .map(UserRole::getRole)
                .filter(Objects::nonNull)
                .filter(Role::getActive)
                .flatMap(role -> role.getPermissions() == null
                        ? Stream.empty()
                        : role.getPermissions().stream())
                .filter(RolePermission::getActive)
                .map(RolePermission::getPermission)
                .filter(Objects::nonNull);

        Stream<UserPermissionGrant> userGrants = user.getExtraPermissions() == null
                ? Stream.empty()
                : user.getExtraPermissions().stream();

        Stream<Permission> extraPermissions = userGrants
                .filter(grant ->
                        grant.isCurrentlyActive(LocalDateTime.now())
                )
                .map(UserPermissionGrant::getPermission)
                .filter(Objects::nonNull);

        return Stream.concat(rolePermissions, extraPermissions);
    }

    private void addAction(
            Map<Long, List<PermissionAction>> map,
            Long resourceId,
            PermissionAction action
    ) {
        if (resourceId == null || action == null) {
            return;
        }

        List<PermissionAction> actions =
                map.computeIfAbsent(resourceId, ignored -> new ArrayList<>());

        if (!actions.contains(action)) {
            actions.add(action);
        }
    }
}
