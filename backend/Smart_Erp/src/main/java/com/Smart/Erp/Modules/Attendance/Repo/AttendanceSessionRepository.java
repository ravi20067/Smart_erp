package com.Smart.Erp.Modules.Attendance.Repo;

import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    Optional<AttendanceSession> findBySessionUuid(String sessionUuid);

    Optional<AttendanceSession> findFirstByTeacherAndStatus(Teacher teacher, AttendanceSessionStatus status);

    List<AttendanceSession> findAllByTeacherOrderByCreatedAtDesc(Teacher teacher);

    List<AttendanceSession> findAllByStatus(AttendanceSessionStatus status);
}
