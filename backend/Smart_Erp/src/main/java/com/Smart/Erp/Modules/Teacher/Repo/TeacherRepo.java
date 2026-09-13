package com.Smart.Erp.Modules.Teacher.Repo;

import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.User.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeacherRepo extends JpaRepository<Teacher,Long> {
    Optional<Teacher> findByUser(User user);
    List<Teacher> findByIdIn(List<Long> ids);
}
