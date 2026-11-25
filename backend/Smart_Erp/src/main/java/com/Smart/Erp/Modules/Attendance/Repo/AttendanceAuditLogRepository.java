package com.Smart.Erp.Modules.Attendance.Repo;

import com.Smart.Erp.Modules.Attendance.Entity.AttendanceAuditLog;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Student.Entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceAuditLogRepository extends JpaRepository<AttendanceAuditLog, Long> {
    List<AttendanceAuditLog> findAllByAttendanceSessionOrderByTimestampDesc(AttendanceSession session);

    List<AttendanceAuditLog> findAllByStudentOrderByTimestampDesc(Student student);

    List<AttendanceAuditLog> findTop100ByOrderByTimestampDesc();
}
