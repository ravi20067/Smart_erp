package com.Smart.Erp.Modules.Attendance.Repo;

import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.LocalHandshakeRecord;
import com.Smart.Erp.Modules.Student.Entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LocalHandshakeRecordRepository extends JpaRepository<LocalHandshakeRecord, Long> {
    Optional<LocalHandshakeRecord> findByReceiptId(String receiptId);

    Optional<LocalHandshakeRecord> findFirstByAttendanceSessionAndStudent(AttendanceSession attendanceSession, Student student);

    boolean existsByReceiptId(String receiptId);

    boolean existsByTicketId(String ticketId);

    boolean existsByTeacherNonce(String teacherNonce);
}
