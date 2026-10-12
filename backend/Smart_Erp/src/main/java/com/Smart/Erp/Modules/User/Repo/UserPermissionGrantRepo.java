package com.Smart.Erp.Modules.User.Repo;

import com.Smart.Erp.Modules.User.Entity.UserPermissionGrant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserPermissionGrantRepo
        extends JpaRepository<UserPermissionGrant, Long> {
}