package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Modules.Attendance.DTO.GuardDecisionRequest;
import com.Smart.Erp.Modules.Attendance.DTO.GuardDecisionResponse;
import com.Smart.Erp.Modules.Attendance.DTO.GuardStudentDetailResponse;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.FaceVerificationSession;
import com.Smart.Erp.Modules.Attendance.Entity.LocalHandshakeRecord;
import com.Smart.Erp.Modules.Attendance.Entity.SecurityGuardCheckIn;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceEventType;
import com.Smart.Erp.Modules.Attendance.Enum.GuardCheckInState;
import com.Smart.Erp.Modules.Attendance.Enum.VerificationState;
import com.Smart.Erp.Modules.Attendance.Repo.FaceVerificationSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.LocalHandshakeRecordRepository;
import com.Smart.Erp.Modules.Attendance.Repo.SecurityGuardCheckInRepository;
import com.Smart.Erp.Modules.Attendance.Repo.StudentAttendanceRepository;
import com.Smart.Erp.Modules.SecurityGuard.Entity.SecurityGuard;
import com.Smart.Erp.Modules.SecurityGuard.Repo.SecurityGuardRepo;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class GuardApprovalService {

    private final SecurityGuardCheckInRepository checkInRepository;
    private final FaceVerificationSessionRepository verificationSessionRepository;
    private final LocalHandshakeRecordRepository handshakeRecordRepository;
    private final StudentAttendanceRepository studentAttendanceRepository;
    private final AttendanceDecisionService attendanceDecisionService;
    private final QRTokenService qrTokenService;
    private final SecurityGuardRepo securityGuardRepo;
    private final UserRepo userRepo;
    private final AttendanceWebSocketPublisher webSocketPublisher;
    private final AttendanceAuditService auditService;
    private final StringRedisTemplate redisTemplate;

    public GuardStudentDetailResponse scanStudentCheckIn(String checkInToken, String guardUsername) {
        String cleanToken = checkInToken != null ? checkInToken.replace("CHECKIN:", "").trim() : "";
        SecurityGuardCheckIn checkIn = checkInRepository.findByCheckInToken(cleanToken)
                .orElseThrow(() -> new RuntimeException("Invalid or unrecognized Check-In QR token"));

        if (LocalDateTime.now().isAfter(checkIn.getExpiresAt())) {
            throw new RuntimeException("Check-In QR token has expired");
        }

        Student student = checkIn.getStudent();
        AttendanceSession session = checkIn.getAttendanceSession();
        User studentUser = student.getUser();

        String studentName = studentUser != null && studentUser.getBasicDetail() != null
                ? studentUser.getBasicDetail().getFirstName() + " " + studentUser.getBasicDetail().getLastName()
                : "Student #" + student.getId();

        String rollNumber = student.getEnrollments() != null && !student.getEnrollments().isEmpty()
                ? student.getEnrollments().get(0).getRollNumber()
                : student.getRegistrationNumber();

        boolean hasPhoto = studentUser != null && studentUser.getBasicDetail() != null &&
                studentUser.getBasicDetail().getPhoto() != null;

        // Secure photo streaming endpoint for Guard UI
        String photoUrl = hasPhoto ? "/security-guard/check-in/photo/" + student.getId() : null;

        Optional<FaceVerificationSession> fvsOpt = verificationSessionRepository
                .findFirstByStudentAndAttendanceSessionAndStatus(student, session, VerificationState.PASSED);

        Optional<LocalHandshakeRecord> handshakeOpt = handshakeRecordRepository
                .findFirstByAttendanceSessionAndStudent(session, student);

        boolean isAlreadyDecided = checkIn.getStatus() != GuardCheckInState.PENDING ||
                studentAttendanceRepository.existsByAttendanceSessionAndStudent(session, student);

        return GuardStudentDetailResponse.builder()
                .checkInToken(cleanToken)
                .studentId(student.getId())
                .studentName(studentName)
                .rollNumber(rollNumber)
                .registrationNumber(student.getRegistrationNumber())
                .courseName(session.getCourse() != null ? session.getCourse().getName() : "N/A")
                .sectionName(session.getSection() != null ? session.getSection().getName() : "N/A")
                .academicYearName(session.getAcademicYear() != null ? session.getAcademicYear().getName() : "N/A")
                .photoUrl(photoUrl)
                .hasRegisteredPhoto(hasPhoto)
                .sessionUuid(session.getSessionUuid())
                .subjectName(session.getSubject() != null ? session.getSubject().getName() : "N/A")
                .teacherName(session.getTeacher().getUser() != null && session.getTeacher().getUser().getBasicDetail() != null
                        ? session.getTeacher().getUser().getBasicDetail().getFirstName() + " " + session.getTeacher().getUser().getBasicDetail().getLastName()
                        : "Teacher #" + session.getTeacher().getId())
                .faceVerificationPassed(fvsOpt.isPresent())
                .similarityScore(fvsOpt.map(FaceVerificationSession::getMatchedSimilarity).orElse(null))
                .handshakeVerified(handshakeOpt.isPresent())
                .guardCheckInStatus(checkIn.getStatus().name())
                .alreadyDecided(isAlreadyDecided)
                .build();
    }

    public GuardDecisionResponse processGuardDecision(GuardDecisionRequest request, String guardUsername) {
        String cleanToken = request.getCheckInToken() != null ? request.getCheckInToken().replace("CHECKIN:", "").trim() : "";

        // Distributed lock to prevent race conditions when two guards scan/decide concurrently
        String lockKey = "lock:guard_decision:" + cleanToken;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", Duration.ofSeconds(10));
        if (Boolean.FALSE.equals(acquired)) {
            throw new RuntimeException("Concurrent decision detected: this check-in is currently being processed by another security station.");
        }

        try {
            SecurityGuardCheckIn checkIn = checkInRepository.findByCheckInToken(cleanToken)
                    .orElseThrow(() -> new RuntimeException("Check-In token not found"));

            if (checkIn.getStatus() != GuardCheckInState.PENDING) {
                throw new RuntimeException("This Check-In has already been " + checkIn.getStatus().name() + " by Guard #" +
                        (checkIn.getGuard() != null ? checkIn.getGuard().getBadgeNumber() : ""));
            }

            User guardUser = userRepo.findByUsername(guardUsername)
                    .orElseThrow(() -> new RuntimeException("Guard user not found: " + guardUsername));
            SecurityGuard guard = securityGuardRepo.findByUser(guardUser)
                    .orElse(null); // Allow admin / super admin fallback if needed

            Student student = checkIn.getStudent();
            AttendanceSession session = checkIn.getAttendanceSession();

            String studentName = student.getUser() != null && student.getUser().getBasicDetail() != null
                    ? student.getUser().getBasicDetail().getFirstName() + " " + student.getUser().getBasicDetail().getLastName()
                    : student.getRegistrationNumber();

            String rollNumber = student.getEnrollments() != null && !student.getEnrollments().isEmpty()
                    ? student.getEnrollments().get(0).getRollNumber()
                    : student.getRegistrationNumber();

            if (!request.isApproved()) {
                // Rejection branch: mandatory rejection reason
                if (request.getRejectionReason() == null || request.getRejectionReason().trim().isBlank()) {
                    throw new RuntimeException("A mandatory rejection reason is required when rejecting a student check-in.");
                }

                checkIn.setStatus(GuardCheckInState.REJECTED);
                checkIn.setRejectionReason(request.getRejectionReason().trim());
                checkIn.setGuard(guard);
                checkIn.setActionTime(LocalDateTime.now());
                checkIn.setClientDeviceDetails(request.getDeviceDetails());
                checkInRepository.save(checkIn);

                qrTokenService.invalidateCheckInToken(cleanToken);

                auditService.logEvent(
                        session, student, guardUser, "SECURITY_GUARD",
                        "GUARD_REJECTED", "GUARD_CHECKIN_PENDING", "GUARD_REJECTED",
                        "Guard rejected check-in. Reason: " + request.getRejectionReason().trim(),
                        request.getDeviceDetails()
                );

                webSocketPublisher.publishEvent(
                        AttendanceEventType.GUARD_REJECTED,
                        session.getSessionUuid(),
                        student.getId(),
                        studentName,
                        rollNumber,
                        "REJECTED",
                        "Security check-in rejected: " + request.getRejectionReason().trim()
                );

                return GuardDecisionResponse.builder()
                        .checkInToken(cleanToken)
                        .studentName(studentName)
                        .decision("REJECTED")
                        .attendanceMarked(false)
                        .message("Student check-in has been rejected. Attendance was NOT marked.")
                        .build();
            }

            // Approval branch
            checkIn.setStatus(GuardCheckInState.APPROVED);
            checkIn.setGuard(guard);
            checkIn.setActionTime(LocalDateTime.now());
            checkIn.setClientDeviceDetails(request.getDeviceDetails());
            checkInRepository.save(checkIn);

            qrTokenService.invalidateCheckInToken(cleanToken);

            auditService.logEvent(
                    session, student, guardUser, "SECURITY_GUARD",
                    "GUARD_APPROVED", "GUARD_CHECKIN_PENDING", "GUARD_APPROVED",
                    "Guard approved check-in for student " + studentName,
                    request.getDeviceDetails()
            );

            webSocketPublisher.publishEvent(
                    AttendanceEventType.GUARD_APPROVED,
                    session.getSessionUuid(),
                    student.getId(),
                    studentName,
                    rollNumber,
                    "APPROVED",
                    "Security Guard approved check-in for " + studentName
            );

            // Execute final authoritative attendance marking
            attendanceDecisionService.evaluateAndMarkAttendance(
                    session,
                    student,
                    guard,
                    "Verified by Guard: " + (guard != null ? guard.getBadgeNumber() : guardUsername)
            );

            return GuardDecisionResponse.builder()
                    .checkInToken(cleanToken)
                    .studentName(studentName)
                    .decision("APPROVED")
                    .attendanceMarked(true)
                    .message("Student check-in approved and attendance marked successfully.")
                    .build();
        } finally {
            redisTemplate.delete(lockKey);
        }
    }
}
