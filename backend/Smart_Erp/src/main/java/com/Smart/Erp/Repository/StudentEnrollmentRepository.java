package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.StudentEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public interface StudentEnrollmentRepository extends JpaRepository<StudentEnrollment,Long> {

}
