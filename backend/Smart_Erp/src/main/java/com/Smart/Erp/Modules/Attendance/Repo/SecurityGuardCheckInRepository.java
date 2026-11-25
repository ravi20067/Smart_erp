package com.Smart.Erp.Modules.Attendance.Repo;

import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.SecurityGuardCheckIn;
import com.Smart.Erp.Modules.Attendance.Enum.GuardCheckInState;
import com.Smart.Erp.Modules.SecurityGuard.Entity.SecurityGuard;
import com.Smart.Erp.Modules.Student.Entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecurityGuardCheckInRepository extends JpaRepository<SecurityGuardCheckIn, Long> {
    Optional<SecurityGuardCheckIn> findByCheckInToken(String checkInToken);

    Optional<SecurityGuardCheckIn> findFirstByAttendanceSessionAndStudentAndStatus(
            AttendanceSession attendanceSession, Student student, GuardCheckInState status
    );

    List<SecurityGuardCheckIn> findAllByGuardOrderByActionTimeDesc(SecurityGuard guard);

    List<SecurityGuardCheckIn> findAllByAttendanceSessionOrderByCreatedAtDesc(AttendanceSession session);

    List<SecurityGuardCheckIn> findAllByStatusOrderByCreatedAtDesc(GuardCheckInState status);
}
