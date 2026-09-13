package com.Smart.Erp.Modules.Student.Repo;

import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public interface StudentEnrollmentRepo extends JpaRepository<StudentEnrollment,Long> {

}
