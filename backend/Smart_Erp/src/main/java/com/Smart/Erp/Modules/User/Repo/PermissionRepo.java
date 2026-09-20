package com.Smart.Erp.Modules.User.Repo;

import com.Smart.Erp.Modules.User.Entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepo extends JpaRepository<Permission,Long> {
}
