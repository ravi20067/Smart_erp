package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Modules.Attendance.DTO.StudentCheckInQRResponse;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.FaceVerificationSession;
import com.Smart.Erp.Modules.Attendance.Entity.LocalHandshakeRecord;
import com.Smart.Erp.Modules.Attendance.Entity.SecurityGuardCheckIn;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceEventType;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import com.Smart.Erp.Modules.Attendance.Enum.GuardCheckInState;
import com.Smart.Erp.Modules.Attendance.Enum.VerificationState;
import com.Smart.Erp.Modules.Attendance.Repo.AttendanceSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.FaceVerificationSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.LocalHandshakeRecordRepository;
import com.Smart.Erp.Modules.Attendance.Repo.SecurityGuardCheckInRepository;
import com.Smart.Erp.Modules.Attendance.Repo.StudentAttendanceRepository;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CheckInService {

    private final AttendanceSessionRepository sessionRepository;
    private final FaceVerificationSessionRepository verificationSessionRepository;
    private final LocalHandshakeRecordRepository handshakeRecordRepository;
    private final SecurityGuardCheckInRepository checkInRepository;
    private final StudentAttendanceRepository attendanceRepository;
    private final StudentRepo studentRepo;
    private final UserRepo userRepo;
    private final QRTokenService qrTokenService;
    private final AttendanceWebSocketPublisher webSocketPublisher;
    private final AttendanceAuditService auditService;
    private final CampusCheckInService campusCheckInService;

    public StudentCheckInQRResponse generateStudentCheckInQR(String sessionUuid, String studentUsername) {
        User user = userRepo.findByUsername(studentUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + studentUsername));
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Student record not found for: " + studentUsername));

        AttendanceSession session = sessionRepository.findBySessionUuid(sessionUuid)
                .orElseThrow(() -> new RuntimeException("Attendance session not found: " + sessionUuid));

        if (session.getStatus() != AttendanceSessionStatus.ACTIVE || LocalDateTime.now().isAfter(session.getExpiresAt())) {
            throw new RuntimeException("Attendance session is not active");
        }

        if (attendanceRepository.existsByAttendanceSessionAndStudent(session, student)) {
            throw new RuntimeException("Attendance has already been marked for this session");
        }

        // Mandatory Gate: Student must have an approved, open Campus Check-In and not be checked out
        campusCheckInService.requireOpenCampusCheckIn(student);

        // Gate 1: Face verification passed
        FaceVerificationSession fvs = verificationSessionRepository
                .findFirstByStudentAndAttendanceSessionAndStatus(student, session, VerificationState.PASSED)
                .orElseThrow(() -> new RuntimeException("Mandatory requirement not met: Face liveness and identity verification must be completed first"));

        // Gate 2: Local network handshake verified
        LocalHandshakeRecord handshake = handshakeRecordRepository
                .findFirstByAttendanceSessionAndStudent(session, student)
                .orElseThrow(() -> new RuntimeException("Mandatory requirement not met: Local network QR handshake with teacher device must be completed first"));

        // Check if there's already an active check-in token
        String token = qrTokenService.generateCheckInToken(sessionUuid, student.getId(), 300);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

        SecurityGuardCheckIn checkIn = SecurityGuardCheckIn.builder()
                .checkInToken(token)
                .attendanceSession(session)
                .student(student)
                .status(GuardCheckInState.PENDING)
                .expiresAt(expiresAt)
                .build();

        checkInRepository.save(checkIn);

        String studentName = user.getBasicDetail() != null
                ? user.getBasicDetail().getFirstName() + " " + user.getBasicDetail().getLastName()
                : student.getRegistrationNumber();

        String rollNumber = student.getEnrollments() != null && !student.getEnrollments().isEmpty()
                ? student.getEnrollments().get(0).getRollNumber()
                : student.getRegistrationNumber();

        auditService.logEvent(
                session, student, user, "STUDENT",
                "GUARD_CHECKIN_PENDING", "HANDSHAKE_VERIFIED", "GUARD_CHECKIN_PENDING",
                "Generated student Check-In QR token for Security Guard verification", null
        );

        webSocketPublisher.publishEvent(
                AttendanceEventType.GUARD_CHECKIN_PENDING,
                sessionUuid, student.getId(), studentName, rollNumber,
                "PENDING", "Student presented Check-In QR code at security gate"
        );

        return StudentCheckInQRResponse.builder()
                .checkInToken(token)
                .sessionUuid(sessionUuid)
                .studentId(student.getId())
                .studentName(studentName)
                .rollNumber(rollNumber)
                .courseName(session.getCourse() != null ? session.getCourse().getName() : "N/A")
                .sectionName(session.getSection() != null ? session.getSection().getName() : "N/A")
                .expiresAt(expiresAt)
                .qrData("CHECKIN:" + token)
                .build();
    }
}
