package com.Smart.Erp.Modules.Attendance.Repo;

import com.Smart.Erp.Modules.Attendance.Entity.StudentFaceTemplate;
import com.Smart.Erp.Modules.Student.Entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentFaceTemplateRepository extends JpaRepository<StudentFaceTemplate, Long> {
    Optional<StudentFaceTemplate> findByStudent(Student student);

    Optional<StudentFaceTemplate> findByStudentAndStatus(Student student, String status);

    boolean existsByStudent(Student student);

    boolean existsByStudentAndStatus(Student student, String status);
}
