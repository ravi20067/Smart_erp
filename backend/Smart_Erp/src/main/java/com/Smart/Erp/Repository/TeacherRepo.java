package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.Teacher;
import com.Smart.Erp.Entity.User;
import com.Smart.Erp.Enum.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeacherRepo extends JpaRepository<Teacher,Long> {
    Optional<Teacher> findByUser(User user);
    List<Teacher> findByIdIn(List<Long> ids);
}
