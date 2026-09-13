package com.Smart.Erp.Modules.Teacher.Repo;

import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public interface TeacherEnrollmentRepo extends JpaRepository<TeacherEnrollment,Long> {
}
