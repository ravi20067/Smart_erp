package com.Smart.Erp.Modules.Academic.Repo;

import com.Smart.Erp.Modules.Academic.Entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepo extends JpaRepository<Course,Long> {
}
