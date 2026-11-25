package com.Smart.Erp.Modules.Student.Repo;

import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentEnrollmentRepo extends JpaRepository<StudentEnrollment, Long> {
    long countBySectionGroup(SectionGroup sectionGroup);
    Optional<StudentEnrollment> findByStudent(Student student);
    List<StudentEnrollment> findAllByStudent(Student student);
}
