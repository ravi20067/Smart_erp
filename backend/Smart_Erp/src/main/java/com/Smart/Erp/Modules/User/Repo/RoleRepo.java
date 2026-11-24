package com.Smart.Erp.Modules.User.Repo;

import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.User.Entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoleRepo extends JpaRepository<Role, Long> {
    List<Role> findByUniversity(University university);
}
