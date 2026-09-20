package com.Smart.Erp.Modules.Academic.Repo;

import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepo extends JpaRepository<Course,Long> {

    Course findByProgramCoordinator(Teacher teacher);

    boolean existsByIdAndDepartmentUniversityId(Long courseId, Long universityId);
}
