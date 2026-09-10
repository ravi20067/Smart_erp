package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.TeacherEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public interface TeacherEnrollmentRepo extends JpaRepository<TeacherEnrollment,Long> {
}
