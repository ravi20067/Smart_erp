package com.Smart.Erp.Modules.Student.Repo;

import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.User.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepo extends JpaRepository<Student, Long> {
    Optional<Student> findByUser(User user);
    Optional<Student> findByUserId(Long userId);
    Optional<Student> findByRegistrationNumber(String registrationNumber);
}
