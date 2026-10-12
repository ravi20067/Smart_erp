package com.Smart.Erp.Modules.User.Repo;

import com.Smart.Erp.Modules.User.Entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolePermissionRepo extends JpaRepository<RolePermission,Long> {
}
