package com.Smart.Erp.Modules.User.Repo;

import com.Smart.Erp.Modules.User.Entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepo extends JpaRepository<Role, Long> {
}
