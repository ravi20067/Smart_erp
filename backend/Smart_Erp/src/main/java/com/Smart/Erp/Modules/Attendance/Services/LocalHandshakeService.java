package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Attendance.DTO.LocalHandshakeRequest;
import com.Smart.Erp.Modules.Attendance.DTO.LocalHandshakeResponse;
import com.Smart.Erp.Modules.Attendance.DTO.StudentHandshakeTicketRequest;
import com.Smart.Erp.Modules.Attendance.DTO.StudentHandshakeTicketResponse;
import com.Smart.Erp.Modules.Attendance.DTO.TeacherQRPayload;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.LocalHandshakeRecord;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceEventType;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import com.Smart.Erp.Modules.Attendance.Enum.VerificationState;
import com.Smart.Erp.Modules.Attendance.Repo.AttendanceSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.FaceVerificationSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.LocalHandshakeRecordRepository;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LocalHandshakeService {

    private static final long TICKET_TTL_MS = 60_000L;
    private static final long MAX_RECEIPT_AGE_MS = 120_000L;

    private final AttendanceSessionRepository sessionRepository;
    private final FaceVerificationSessionRepository verificationSessionRepository;
    private final LocalHandshakeRecordRepository handshakeRecordRepository;
    private final StudentEnrollmentRepo studentEnrollmentRepo;
    private final StudentRepo studentRepo;
    private final UserRepo userRepo;
    private final QRTokenService qrTokenService;
    private final AttendanceWebSocketPublisher webSocketPublisher;
    private final AttendanceAuditService auditService;
    private final StringRedisTemplate redisTemplate;
    private final CampusCheckInService campusCheckInService;
    private final LocalNetworkPolicy localNetworkPolicy;
    private final CryptographicHandshakeService cryptographicHandshakeService;

    public StudentHandshakeTicketResponse issueHandshakeTicket(
            StudentHandshakeTicketRequest request,
            String studentUsername,
            Map<String, String> requestHeaders
    ) {
        localNetworkPolicy.rejectProxyHeaders(requestHeaders);

        User user = userRepo.findByUsername(studentUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + studentUsername));
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Student profile not found for: " + studentUsername));

        campusCheckInService.requireOpenCampusCheckIn(student);

        AttendanceSession session = sessionRepository.findBySessionUuid(request.getSessionUuid())
                .orElseThrow(() -> new RuntimeException("Attendance session not found: " + request.getSessionUuid()));

        if (session.getStatus() != AttendanceSessionStatus.ACTIVE || LocalDateTime.now().isAfter(session.getExpiresAt())) {
            throw new OperationNotAllowedException("Attendance session is no longer active");
        }

        boolean isEnrolled = studentEnrollmentRepo.findAllByStudent(student).stream()
                .anyMatch(e -> e.getSectionGroup() != null
                        && e.getSectionGroup().getSection() != null
                        && e.getSectionGroup().getSection().getId().equals(session.getSection().getId()));
        if (!isEnrolled) {
            throw new OperationNotAllowedException("Access denied: Student is not enrolled in section " + session.getSection().getName());
        }

        verificationSessionRepository
                .findFirstByStudentAndAttendanceSessionAndStatus(student, session, VerificationState.PASSED)
                .orElseThrow(() -> new RuntimeException("Face liveness & identity verification required before requesting a handshake ticket"));

        if (session.getTeacherEd25519PublicKey() == null || session.getTeacherEd25519PublicKey().isBlank()
                || session.getTeacherX25519PublicKey() == null || session.getTeacherX25519PublicKey().isBlank()) {
            throw new OperationNotAllowedException("Teacher companion cryptographic keys are not initialized for this session");
        }

        if (request.getStudentNonce() == null || request.getStudentNonce().trim().length() < 16) {
            throw new OperationNotAllowedException("A cryptographically random student nonce is required");
        }

        cryptographicHandshakeService.validateEd25519AndX25519Keys(
                request.getStudentEd25519PublicKey(),
                request.getStudentX25519PublicKey(),
                "student"
        );

        String ticketId = "HST-" + UUID.randomUUID();
        long issuedAt = System.currentTimeMillis();
        long expiresAt = issuedAt + TICKET_TTL_MS;
        String studentRef = student.getRegistrationNumber() != null
                ? student.getRegistrationNumber()
                : String.valueOf(student.getId());

        String canonicalTicket = cryptographicHandshakeService.canonicalStudentTicketMessage(
                ticketId,
                session.getSessionUuid(),
                student.getId(),
                studentRef,
                request.getStudentEd25519PublicKey().trim(),
                request.getStudentX25519PublicKey().trim(),
                request.getStudentNonce().trim(),
                issuedAt,
                expiresAt
        );
        String backendSignature = cryptographicHandshakeService.signWithBackendKey(canonicalTicket);
        String backendPublicKey = cryptographicHandshakeService.getBackendEd25519PublicKeyBase64();

        String storedTicket = String.join("|",
                session.getSessionUuid(),
                String.valueOf(student.getId()),
                studentRef,
                request.getStudentEd25519PublicKey().trim(),
                request.getStudentX25519PublicKey().trim(),
                request.getStudentNonce().trim(),
                String.valueOf(expiresAt)
        );
        redisTemplate.opsForValue().set(
                "attendance:handshake_ticket:" + ticketId,
                storedTicket,
                Duration.ofMillis(TICKET_TTL_MS + 5000L)
        );

        return StudentHandshakeTicketResponse.builder()
                .ticketId(ticketId)
                .sessionUuid(session.getSessionUuid())
                .studentId(student.getId())
                .studentRef(studentRef)
                .studentEd25519PublicKey(request.getStudentEd25519PublicKey().trim())
                .studentX25519PublicKey(request.getStudentX25519PublicKey().trim())
                .studentNonce(request.getStudentNonce().trim())
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .backendPublicKey(backendPublicKey)
                .backendTicketSignature(backendSignature)
                .build();
    }

    public LocalHandshakeResponse verifyHandshake(LocalHandshakeRequest request, String studentUsername) {
        return verifyHandshake(request, studentUsername, Map.of());
    }

    public LocalHandshakeResponse verifyHandshake(
            LocalHandshakeRequest request,
            String studentUsername,
            Map<String, String> requestHeaders
    ) {
        localNetworkPolicy.rejectProxyHeaders(requestHeaders);

        User user = userRepo.findByUsername(studentUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + studentUsername));
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Student profile not found for: " + studentUsername));

        campusCheckInService.requireOpenCampusCheckIn(student);

        AttendanceSession session = sessionRepository.findBySessionUuid(request.getSessionUuid())
                .orElseThrow(() -> new RuntimeException("Attendance session not found: " + request.getSessionUuid()));

        if (session.getStatus() != AttendanceSessionStatus.ACTIVE || LocalDateTime.now().isAfter(session.getExpiresAt())) {
            throw new OperationNotAllowedException("Attendance session is no longer active");
        }

        // Distributed concurrency lock per student+session to prevent parallel race double-verifications
        String lockKey = "lock:handshake:" + session.getSessionUuid() + ":" + student.getId();
        Boolean lockAcquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", Duration.ofSeconds(15));
        if (Boolean.FALSE.equals(lockAcquired)) {
            throw new OperationNotAllowedException("Concurrent handshake in progress for this student and session. Please wait.");
        }

        try {
            verificationSessionRepository
                    .findFirstByStudentAndAttendanceSessionAndStatus(student, session, VerificationState.PASSED)
                    .orElseThrow(() -> new RuntimeException("Face liveness & identity verification required before QR handshake"));

            String expectedStudentRef = student.getRegistrationNumber() != null
                    ? student.getRegistrationNumber()
                    : String.valueOf(student.getId());
            if (request.getStudentRef() == null || !expectedStudentRef.equals(request.getStudentRef().trim())) {
                throw new OperationNotAllowedException("Cryptographic handshake rejected: Student identity reference mismatch");
            }

            if (request.getTeacherId() == null || !Objects.equals(request.getTeacherId(), session.getTeacher().getId())) {
                throw new OperationNotAllowedException("Cryptographic handshake rejected: Teacher ID does not match active session");
            }

            if (session.getTeacherEd25519PublicKey() == null || !session.getTeacherEd25519PublicKey().equals(request.getTeacherEd25519PublicKey())
                    || session.getTeacherX25519PublicKey() == null || !session.getTeacherX25519PublicKey().equals(request.getTeacherX25519PublicKey())) {
                throw new OperationNotAllowedException("Cryptographic handshake rejected: Teacher companion public key mismatch");
            }

            LocalHandshakeRecord existingHandshake = handshakeRecordRepository
                    .findFirstByAttendanceSessionAndStudent(session, student)
                    .orElse(null);
            if (existingHandshake != null && "VERIFIED".equalsIgnoreCase(existingHandshake.getStatus())) {
                throw new OperationNotAllowedException("Replay or duplicate handshake rejected: Student has already verified local handshake for this session");
            }

            // 1. Verify Teacher QR HMAC signature (strict binding to session, teacher, LAN IP/port, teacher keys & subnets)
            long effectiveQrExpiresAt = request.getExpiresAt();
            TeacherQRPayload qrPayload = TeacherQRPayload.builder()
                    .sessionId(session.getSessionUuid())
                    .teacherId(request.getTeacherId())
                    .localServerIp(session.getLocalServerIp())
                    .localServerPort(session.getLocalServerPort())
                    .teacherEd25519PublicKey(session.getTeacherEd25519PublicKey())
                    .teacherX25519PublicKey(session.getTeacherX25519PublicKey())
                    .allowedSubnets(session.getAllowedSubnets())
                    .backendPublicKey(cryptographicHandshakeService.getBackendEd25519PublicKeyBase64())
                    .timestamp(request.getTimestamp())
                    .expiresAt(effectiveQrExpiresAt)
                    .nonce(request.getNonce())
                    .signature(request.getQrSignature())
                    .build();

            if (!qrTokenService.verifyTeacherQRPayload(qrPayload)) {
                throw new OperationNotAllowedException("Invalid or expired Teacher Attendance QR signature. Please re-scan the live classroom QR.");
            }

            // 2. Enforce strict LAN-only + allowlisted classroom subnet policy
            localNetworkPolicy.validateLanAndSubnet(session.getLocalServerIp(), session.getAllowedSubnets(), "Teacher companion");
            localNetworkPolicy.validateLanAndSubnet(request.getClientIp(), session.getAllowedSubnets(), "Student peer");

            // 3. Verify handshake receipt expiry window
            long nowMs = System.currentTimeMillis();
            if (request.getReceiptIssuedAt() <= 0
                    || request.getReceiptExpiresAt() <= request.getReceiptIssuedAt()
                    || nowMs > request.getReceiptExpiresAt()
                    || (nowMs - request.getReceiptIssuedAt()) > MAX_RECEIPT_AGE_MS) {
                throw new OperationNotAllowedException("Local handshake receipt is expired or has invalid timestamps");
            }

            // 4. Verify single-use backend-issued handshake ticket binding student keys & nonce
            if (request.getTicketId() == null || request.getTicketId().isBlank()) {
                throw new OperationNotAllowedException("Missing backend-issued student handshake ticketId");
            }
            String ticketRedisKey = "attendance:handshake_ticket:" + request.getTicketId().trim();
            String storedTicket = redisTemplate.opsForValue().get(ticketRedisKey);
            if (storedTicket == null || storedTicket.isBlank()) {
                throw new OperationNotAllowedException("Student handshake ticket not found or expired");
            }
            String[] ticketParts = storedTicket.split("\\|", -1);
            if (ticketParts.length != 7) {
                throw new OperationNotAllowedException("Corrupted student handshake ticket state");
            }
            long ticketExpiresAt = Long.parseLong(ticketParts[6]);
            if (nowMs > ticketExpiresAt) {
                redisTemplate.delete(ticketRedisKey);
                throw new OperationNotAllowedException("Student handshake ticket has expired");
            }
            if (!Objects.equals(ticketParts[0], session.getSessionUuid())
                    || !Objects.equals(ticketParts[1], String.valueOf(student.getId()))
                    || !Objects.equals(ticketParts[2], expectedStudentRef)
                    || !Objects.equals(ticketParts[3], request.getStudentEd25519PublicKey())
                    || !Objects.equals(ticketParts[4], request.getStudentX25519PublicKey())
                    || !Objects.equals(ticketParts[5], request.getStudentNonce())) {
                throw new OperationNotAllowedException("Student handshake ticket mismatch: key, student, session, or nonce binding invalid");
            }
            redisTemplate.delete(ticketRedisKey);

            // 5. Verify Student Ed25519 Proof Signature independently
            cryptographicHandshakeService.validateEd25519AndX25519Keys(
                    request.getStudentEd25519PublicKey(),
                    request.getStudentX25519PublicKey(),
                    "student"
            );
            String canonicalStudentProof = cryptographicHandshakeService.canonicalStudentProofMessage(
                    session.getSessionUuid(),
                    request.getTicketId(),
                    expectedStudentRef,
                    request.getStudentNonce(),
                    request.getTeacherNonce(),
                    session.getTeacherEd25519PublicKey(),
                    session.getTeacherX25519PublicKey(),
                    request.getStudentProofTimestamp()
            );
            if (!cryptographicHandshakeService.verifyEd25519Signature(
                    request.getStudentEd25519PublicKey(),
                    canonicalStudentProof,
                    request.getStudentProofSignature())) {
                throw new OperationNotAllowedException("Invalid student Ed25519 cryptographic proof signature");
            }

            // 6. Verify Teacher Companion Ed25519 Receipt Signature independently
            if (request.getCompanionReceiptId() == null || request.getCompanionReceiptId().isBlank()) {
                throw new OperationNotAllowedException("Missing companionReceiptId in handshake submission");
            }
            String canonicalReceipt = cryptographicHandshakeService.canonicalCompanionReceiptMessage(
                    request.getCompanionReceiptId(),
                    session.getSessionUuid(),
                    session.getTeacher().getId(),
                    expectedStudentRef,
                    request.getTicketId(),
                    request.getTeacherNonce(),
                    request.getStudentNonce(),
                    localNetworkPolicy.normalizeIp(request.getClientIp()),
                    session.getTeacherEd25519PublicKey(),
                    session.getTeacherX25519PublicKey(),
                    request.getStudentEd25519PublicKey(),
                    request.getStudentX25519PublicKey(),
                    request.getReceiptIssuedAt(),
                    request.getReceiptExpiresAt()
            );
            if (!cryptographicHandshakeService.verifyEd25519Signature(
                    session.getTeacherEd25519PublicKey(),
                    canonicalReceipt,
                    request.getTeacherReceiptSignature())) {
                throw new OperationNotAllowedException("Invalid or tampered Teacher Companion Ed25519 receipt signature");
            }

            // 7. Strict Anti-Replay Checks (DB + Redis nonces, ticket, receipt)
            if (handshakeRecordRepository.existsByReceiptId(request.getCompanionReceiptId())
                    || handshakeRecordRepository.existsByTicketId(request.getTicketId())
                    || (request.getTeacherNonce() != null && handshakeRecordRepository.existsByTeacherNonce(request.getTeacherNonce()))) {
                throw new OperationNotAllowedException("Replay attack rejected: Companion receipt, ticket, or teacher nonce already recorded");
            }

            boolean qrNonceFresh = qrTokenService.consumeNonce(
                    request.getNonce(), "TEACHER_ATTENDANCE_QR", session.getSessionUuid(), student.getId(), 300);
            boolean ticketFresh = qrTokenService.consumeNonce(
                    request.getTicketId(), "HANDSHAKE_TICKET", session.getSessionUuid(), student.getId(), 300);
            boolean teacherNonceFresh = qrTokenService.consumeNonce(
                    request.getTeacherNonce(), "COMPANION_TEACHER_NONCE", session.getSessionUuid(), student.getId(), 300);
            boolean studentNonceFresh = qrTokenService.consumeNonce(
                    request.getStudentNonce(), "STUDENT_HANDSHAKE_NONCE", session.getSessionUuid(), student.getId(), 300);

            if (!qrNonceFresh || !ticketFresh || !teacherNonceFresh || !studentNonceFresh) {
                throw new OperationNotAllowedException("Replay protection: One or more handshake nonces/tickets have already been consumed");
            }

            String receiptId = request.getCompanionReceiptId().trim();
            LocalHandshakeRecord record = LocalHandshakeRecord.builder()
                    .attendanceSession(session)
                    .student(student)
                    .receiptId(receiptId)
                    .clientIp(localNetworkPolicy.normalizeIp(request.getClientIp()))
                    .teacherServerIp(localNetworkPolicy.normalizeIp(session.getLocalServerIp()))
                    .teacherServerPort(session.getLocalServerPort() != null ? session.getLocalServerPort() : 8443)
                    .nonce(request.getNonce())
                    .ticketId(request.getTicketId())
                    .teacherNonce(request.getTeacherNonce())
                    .studentNonce(request.getStudentNonce())
                    .studentEd25519PublicKey(request.getStudentEd25519PublicKey())
                    .studentX25519PublicKey(request.getStudentX25519PublicKey())
                    .teacherReceiptSignature(request.getTeacherReceiptSignature())
                    .studentProofSignature(request.getStudentProofSignature())
                    .receiptHmac(request.getReceiptHmac())
                    .timestamp(LocalDateTime.now())
                    .signature(request.getTeacherReceiptSignature())
                    .status("VERIFIED")
                    .build();

            handshakeRecordRepository.save(record);

            redisTemplate.opsForValue().set(
                    "attendance:handshake_receipt:" + receiptId,
                    session.getSessionUuid() + ":" + student.getId(),
                    Duration.ofMinutes(15)
            );

            String studentName = user.getBasicDetail() != null
                    ? user.getBasicDetail().getFirstName() + " " + user.getBasicDetail().getLastName()
                    : expectedStudentRef;

            auditService.logEvent(
                    session, student, user, "STUDENT",
                    "HANDSHAKE_VERIFIED", "IDENTITY_VERIFIED", "HANDSHAKE_VERIFIED",
                    "Cryptographic LAN handshake verified (Ed25519+X25519/HKDF) via teacher " + session.getLocalServerIp() + ":" + session.getLocalServerPort(),
                    localNetworkPolicy.normalizeIp(request.getClientIp())
            );

            webSocketPublisher.publishEvent(
                    AttendanceEventType.HANDSHAKE_VERIFIED,
                    session.getSessionUuid(),
                    student.getId(),
                    studentName,
                    expectedStudentRef,
                    "VERIFIED",
                    "Cryptographic local network handshake verified for student"
            );

            return LocalHandshakeResponse.builder()
                    .receiptId(receiptId)
                    .sessionUuid(session.getSessionUuid())
                    .verified(true)
                    .status("VERIFIED")
                    .message("Cryptographic local network handshake (Ed25519 + X25519/HKDF) verified successfully.")
                    .receiptSignature(request.getTeacherReceiptSignature())
                    .build();
        } finally {
            redisTemplate.delete(lockKey);
        }
    }
}
