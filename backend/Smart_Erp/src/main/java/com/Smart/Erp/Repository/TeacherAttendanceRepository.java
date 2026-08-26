package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.Teacher;
import com.Smart.Erp.Entity.TeacherAttendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TeacherAttendanceRepository
        extends JpaRepository<TeacherAttendance, Long> {
    Optional<TeacherAttendance> findByTeacherAndAttendanceDate(
            Teacher teacher,
            LocalDate attendanceDate
    );

    Long countByAttendanceDate(LocalDate attendanceDate);
}
