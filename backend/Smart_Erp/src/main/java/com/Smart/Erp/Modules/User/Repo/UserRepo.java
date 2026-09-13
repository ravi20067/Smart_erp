package com.Smart.Erp.Modules.User.Repo;

import com.Smart.Erp.Modules.User.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepo extends JpaRepository<User,Long> {
    Optional<User> findByUsername(String Username);
}
