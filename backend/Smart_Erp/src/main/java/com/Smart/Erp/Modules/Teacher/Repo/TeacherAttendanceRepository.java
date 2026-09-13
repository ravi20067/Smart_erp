package com.Smart.Erp.Modules.Teacher.Repo;

import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherAttendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface TeacherAttendanceRepository
        extends JpaRepository<TeacherAttendance, Long> {
    Optional<TeacherAttendance> findByTeacherAndAttendanceDate(
            Teacher teacher,
            LocalDate attendanceDate
    );

    Long countByAttendanceDate(LocalDate attendanceDate);
}
