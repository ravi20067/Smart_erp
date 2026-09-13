package com.Smart.Erp.Modules.Subject.Repo;

import com.Smart.Erp.Modules.Subject.Entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectRepo extends JpaRepository<Subject, Long> {
    List<Subject> findBySubjectTeachers_Id(Long teacherId);
}
