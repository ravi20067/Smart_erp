package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepo extends JpaRepository<Course,Long> {

}
