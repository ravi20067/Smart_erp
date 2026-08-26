package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.Course;
import com.Smart.Erp.Entity.CourseSubject;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseSubjectRepo extends JpaRepository<CourseSubject,Long> {
}
