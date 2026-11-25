package com.Smart.Erp.Modules.Attendance.Repo;

import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.FaceVerificationSession;
import com.Smart.Erp.Modules.Attendance.Enum.VerificationState;
import com.Smart.Erp.Modules.Student.Entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FaceVerificationSessionRepository extends JpaRepository<FaceVerificationSession, Long> {
    Optional<FaceVerificationSession> findBySessionId(String sessionId);

    Optional<FaceVerificationSession> findFirstByStudentAndAttendanceSessionAndStatus(
            Student student, AttendanceSession attendanceSession, VerificationState status
    );

    List<FaceVerificationSession> findAllByStudentOrderByCreatedAtDesc(Student student);
}
