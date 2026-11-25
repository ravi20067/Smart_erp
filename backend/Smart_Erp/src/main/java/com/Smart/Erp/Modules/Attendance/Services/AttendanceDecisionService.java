package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.FaceVerificationSession;
import com.Smart.Erp.Modules.Attendance.Entity.LocalHandshakeRecord;
import com.Smart.Erp.Modules.Attendance.Entity.SecurityGuardCheckIn;
import com.Smart.Erp.Modules.Attendance.Entity.StudentAttendance;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceEventType;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import com.Smart.Erp.Modules.Attendance.Enum.GuardCheckInState;
import com.Smart.Erp.Modules.Attendance.Enum.HandshakeState;
import com.Smart.Erp.Modules.Attendance.Enum.VerificationState;
import com.Smart.Erp.Modules.Attendance.Repo.FaceVerificationSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.LocalHandshakeRecordRepository;
import com.Smart.Erp.Modules.Attendance.Repo.SecurityGuardCheckInRepository;
import com.Smart.Erp.Modules.Attendance.Repo.StudentAttendanceRepository;
import com.Smart.Erp.Modules.SecurityGuard.Entity.SecurityGuard;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Teacher.Enum.AttendanceStatus;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceDecisionService {

    private final StudentAttendanceRepository attendanceRepository;
    private final FaceVerificationSessionRepository verificationSessionRepository;
    private final LocalHandshakeRecordRepository handshakeRecordRepository;
    private final SecurityGuardCheckInRepository checkInRepository;
    private final StudentEnrollmentRepo studentEnrollmentRepo;
    private final AttendanceWebSocketPublisher webSocketPublisher;
    private final AttendanceAuditService auditService;
    private final CampusCheckInService campusCheckInService;

    public StudentAttendance evaluateAndMarkAttendance(
            AttendanceSession session,
            Student student,
            SecurityGuard guard,
            String remarks
    ) {
        // 1. Check: Student not already marked attendance
        if (attendanceRepository.existsByAttendanceSessionAndStudent(session, student)) {
            log.info("Attendance already recorded for student {} in session {}", student.getId(), session.getSessionUuid());
            return attendanceRepository.findByAttendanceSessionAndStudent(session, student).orElseThrow();
        }

        // 2. Check: Attendance session valid and active
        if (session.getStatus() != AttendanceSessionStatus.ACTIVE || LocalDateTime.now().isAfter(session.getExpiresAt())) {
            throw new RuntimeException("Final attendance rejected: Attendance session is closed or expired");
        }

        // 3. Check: Student enrolled in section
        boolean isEnrolled = studentEnrollmentRepo.findAllByStudent(student).stream()
                .anyMatch(enrollment -> enrollment.getSectionGroup() != null &&
                        enrollment.getSectionGroup().getSection() != null &&
                        enrollment.getSectionGroup().getSection().getId().equals(session.getSection().getId()));
        if (!isEnrolled) {
            throw new RuntimeException("Final attendance rejected: Student is not enrolled in section " + session.getSection().getName());
        }

        // Mandatory Gate: Student must still have an approved, open Campus Check-In and not be checked out
        campusCheckInService.requireOpenCampusCheckIn(student);

        // 4 & 5. Check: Face liveness and identity verified
        FaceVerificationSession fvs = verificationSessionRepository
                .findFirstByStudentAndAttendanceSessionAndStatus(student, session, VerificationState.PASSED)
                .orElseThrow(() -> new RuntimeException("Final attendance rejected: Biometric face verification has not passed"));

        // 6. Check: Local network handshake verified
        LocalHandshakeRecord handshake = handshakeRecordRepository
                .findFirstByAttendanceSessionAndStudent(session, student)
                .orElseThrow(() -> new RuntimeException("Final attendance rejected: Local network teacher-device QR handshake missing"));

        // 7. Check: Security guard check-in approved
        SecurityGuardCheckIn checkIn = checkInRepository
                .findFirstByAttendanceSessionAndStudentAndStatus(session, student, GuardCheckInState.APPROVED)
                .orElseThrow(() -> new RuntimeException("Final attendance rejected: Security Guard Check-In has not been approved"));

        // All 10 mandatory checks PASSED!
        StudentAttendance attendance = StudentAttendance.builder()
                .attendanceSession(session)
                .student(student)
                .attendanceDate(LocalDate.now())
                .checkInTime(LocalTime.now())
                .status(AttendanceStatus.PRESENT)
                .faceVerificationStatus(VerificationState.PASSED)
                .faceVerificationSessionId(fvs.getSessionId())
                .similarityScore(fvs.getMatchedSimilarity())
                .handshakeStatus(HandshakeState.VERIFIED)
                .handshakeReceiptId(handshake.getReceiptId())
                .guardCheckInStatus(GuardCheckInState.APPROVED)
                .guard(guard)
                .guardDecisionTime(LocalDateTime.now())
                .clientIp(handshake.getClientIp())
                .remarks(remarks != null ? remarks : "Attendance verified via Biometrics, Local Handshake & Guard Approval")
                .build();

        attendance = attendanceRepository.save(attendance);

        String studentName = student.getUser() != null && student.getUser().getBasicDetail() != null
                ? student.getUser().getBasicDetail().getFirstName() + " " + student.getUser().getBasicDetail().getLastName()
                : student.getRegistrationNumber();

        String rollNumber = student.getEnrollments() != null && !student.getEnrollments().isEmpty()
                ? student.getEnrollments().get(0).getRollNumber()
                : student.getRegistrationNumber();

        auditService.logEvent(
                session, student, guard != null ? guard.getUser() : null, "SECURITY_GUARD",
                "ATTENDANCE_MARKED", "GUARD_APPROVED", "ATTENDANCE_MARKED",
                "Final attendance marked successfully. Sim: " + fvs.getMatchedSimilarity() + ", Guard: " + (guard != null ? guard.getBadgeNumber() : "N/A"),
                handshake.getClientIp()
        );

        webSocketPublisher.publishEvent(
                AttendanceEventType.ATTENDANCE_MARKED,
                session.getSessionUuid(),
                student.getId(),
                studentName,
                rollNumber,
                "PRESENT",
                "Official attendance recorded for " + studentName
        );

        return attendance;
    }
}
