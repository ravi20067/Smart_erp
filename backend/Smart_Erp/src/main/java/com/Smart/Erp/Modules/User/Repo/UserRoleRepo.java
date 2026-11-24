package com.Smart.Erp.Modules.User.Repo;

import com.Smart.Erp.Modules.User.Entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepo extends JpaRepository<UserRole, Long> {
}
