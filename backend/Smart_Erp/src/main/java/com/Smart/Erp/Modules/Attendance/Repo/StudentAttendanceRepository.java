package com.Smart.Erp.Modules.Attendance.Repo;

import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.StudentAttendance;
import com.Smart.Erp.Modules.Student.Entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentAttendanceRepository extends JpaRepository<StudentAttendance, Long> {
    Optional<StudentAttendance> findByAttendanceSessionAndStudent(AttendanceSession attendanceSession, Student student);

    List<StudentAttendance> findAllByAttendanceSession(AttendanceSession attendanceSession);

    List<StudentAttendance> findAllByStudentOrderByAttendanceDateDesc(Student student);

    boolean existsByAttendanceSessionAndStudent(AttendanceSession attendanceSession, Student student);

    long countByAttendanceSession(AttendanceSession attendanceSession);
}
