package com.Smart.Erp.Modules.User.Repo;

import com.Smart.Erp.Modules.User.Entity.Permission;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface PermissionRepo extends JpaRepository<Permission,Long> {
    Optional<Permission> findByResourceTypeAndActionAndResourceId(ResourceType resourceType, PermissionAction action, Long resourceId);
    List<Permission> findByResourceTypeAndResourceId(ResourceType resourceType,Long resourceId);
    List<Permission> findByResourceType(ResourceType resourceType);
    Set<Permission> findByIdIn(Collection<Long> ids);
}
