package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.AcademicYear;
import com.Smart.Erp.Entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubjectRepo extends JpaRepository<Subject, Long> {
    List<Subject> findBySubjectTeachers_Id(Long teacherId);
}
