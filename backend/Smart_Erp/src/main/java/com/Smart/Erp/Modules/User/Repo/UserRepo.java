package com.Smart.Erp.Modules.User.Repo;

import com.Smart.Erp.Modules.User.Entity.User;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepo extends JpaRepository<User,Long> {
    Optional<User> findByUsername(String Username);

    // Finds the user if the input matches username, email, OR phone number
    @Query("SELECT u FROM User u WHERE u.username = :identifier OR u.basicDetail.email = :identifier OR u.basicDetail.phone = :identifier")
    Optional<User> findByLoginIdentifier(@Param("identifier") String identifier);
}
