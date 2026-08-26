package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.Student;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface StudentRepo extends JpaRepository<Student, Long> {

}
