package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Attendance.DTO.LocalHandshakeRequest;
import com.Smart.Erp.Modules.Attendance.DTO.LocalHandshakeResponse;
import com.Smart.Erp.Modules.Attendance.DTO.StudentHandshakeTicketRequest;
import com.Smart.Erp.Modules.Attendance.DTO.StudentHandshakeTicketResponse;
import com.Smart.Erp.Modules.Attendance.DTO.TeacherQRPayload;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.FaceVerificationSession;
import com.Smart.Erp.Modules.Attendance.Entity.LocalHandshakeRecord;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import com.Smart.Erp.Modules.Attendance.Enum.VerificationState;
import com.Smart.Erp.Modules.Attendance.Repo.AttendanceSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.FaceVerificationSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.LocalHandshakeRecordRepository;
import com.Smart.Erp.Modules.Attendance.Repo.QRTokenUsageRepository;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LocalHandshakeServiceTest {

    @Mock private AttendanceSessionRepository sessionRepository;
    @Mock private FaceVerificationSessionRepository verificationSessionRepository;
    @Mock private LocalHandshakeRecordRepository handshakeRecordRepository;
    @Mock private QRTokenUsageRepository qrTokenUsageRepository;
    @Mock private StudentEnrollmentRepo studentEnrollmentRepo;
    @Mock private StudentRepo studentRepo;
    @Mock private UserRepo userRepo;
    @Mock private AttendanceWebSocketPublisher webSocketPublisher;
    @Mock private AttendanceAuditService auditService;
    @Mock private CampusCheckInService campusCheckInService;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOperations;

    private CryptographicHandshakeService cryptoService;
    private LocalNetworkPolicy localNetworkPolicy;
    private QRTokenService qrTokenService;
    private LocalHandshakeService localHandshakeService;

    private final ConcurrentHashMap<String, String> redisStore = new ConcurrentHashMap<>();
    private final AtomicReference<LocalHandshakeRecord> savedRecord = new AtomicReference<>();

    private User studentUser;
    private Student student;
    private Teacher teacher;
    private AttendanceSession session;
    private KeyPair teacherEdPair;
    private KeyPair teacherXPair;
    private String teacherEdPubB64;
    private String teacherXPubB64;
    private KeyPair studentEdPair;
    private KeyPair studentXPair;
    private String studentEdPubB64;
    private String studentXPubB64;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() throws Exception {
        redisStore.clear();
        savedRecord.set(null);
        objectMapper = new ObjectMapper();

        cryptoService = new CryptographicHandshakeService();
        cryptoService.initKeys();
        localNetworkPolicy = new LocalNetworkPolicy();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        doAnswer(inv -> {
            redisStore.put(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(valueOperations).set(anyString(), anyString(), any(Duration.class));
        when(valueOperations.get(anyString())).thenAnswer(inv -> redisStore.get(inv.getArgument(0)));
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class)))
                .thenAnswer(inv -> redisStore.putIfAbsent(inv.getArgument(0), inv.getArgument(1)) == null);
        when(redisTemplate.delete(anyString())).thenAnswer(inv -> redisStore.remove(inv.getArgument(0)) != null);

        when(qrTokenUsageRepository.existsByTokenNonce(anyString())).thenReturn(false);

        qrTokenService = new QRTokenService(
                "unit_test_qr_hmac_secret_2026_secure",
                redisTemplate,
                qrTokenUsageRepository,
                objectMapper
        );

        localHandshakeService = new LocalHandshakeService(
                sessionRepository,
                verificationSessionRepository,
                handshakeRecordRepository,
                studentEnrollmentRepo,
                studentRepo,
                userRepo,
                qrTokenService,
                webSocketPublisher,
                auditService,
                redisTemplate,
                campusCheckInService,
                localNetworkPolicy,
                cryptoService
        );

        KeyPairGenerator edGen = KeyPairGenerator.getInstance("Ed25519");
        KeyPairGenerator xGen = KeyPairGenerator.getInstance("X25519");
        teacherEdPair = edGen.generateKeyPair();
        teacherXPair = xGen.generateKeyPair();
        teacherEdPubB64 = Base64.getEncoder().encodeToString(teacherEdPair.getPublic().getEncoded());
        teacherXPubB64 = Base64.getEncoder().encodeToString(teacherXPair.getPublic().getEncoded());

        studentEdPair = edGen.generateKeyPair();
        studentXPair = xGen.generateKeyPair();
        studentEdPubB64 = Base64.getEncoder().encodeToString(studentEdPair.getPublic().getEncoded());
        studentXPubB64 = Base64.getEncoder().encodeToString(studentXPair.getPublic().getEncoded());

        BasicDetail bd = new BasicDetail();
        bd.setFirstName("Aarav");
        bd.setLastName("Sharma");
        studentUser = User.builder().id(101L).username("student1").basicDetail(bd).build();
        student = Student.builder().id(201L).registrationNumber("REG-2026-010").user(studentUser).build();

        teacher = Teacher.builder().id(301L).build();
        Section section = Section.builder().id(401L).name("CSE-A").build();
        SectionGroup group = SectionGroup.builder().id(501L).name("G1").section(section).build();
        StudentEnrollment enrollment = new StudentEnrollment();
        enrollment.setSectionGroup(group);

        session = AttendanceSession.builder()
                .id(601L)
                .sessionUuid("SESSION-CRYPTO-1")
                .teacher(teacher)
                .section(section)
                .status(AttendanceSessionStatus.ACTIVE)
                .localServerIp("192.168.1.100")
                .localServerPort(8443)
                .teacherEd25519PublicKey(teacherEdPubB64)
                .teacherX25519PublicKey(teacherXPubB64)
                .allowedSubnets("192.168.1.0/24")
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        when(userRepo.findByUsername("student1")).thenReturn(Optional.of(studentUser));
        when(studentRepo.findByUser(studentUser)).thenReturn(Optional.of(student));
        when(studentEnrollmentRepo.findAllByStudent(student)).thenReturn(List.of(enrollment));
        when(sessionRepository.findBySessionUuid("SESSION-CRYPTO-1")).thenReturn(Optional.of(session));
        when(verificationSessionRepository.findFirstByStudentAndAttendanceSessionAndStatus(
                student, session, VerificationState.PASSED))
                .thenReturn(Optional.of(FaceVerificationSession.builder().status(VerificationState.PASSED).build()));
        when(handshakeRecordRepository.findFirstByAttendanceSessionAndStudent(session, student))
                .thenAnswer(inv -> Optional.ofNullable(savedRecord.get()));
        when(handshakeRecordRepository.save(any(LocalHandshakeRecord.class))).thenAnswer(inv -> {
            LocalHandshakeRecord r = inv.getArgument(0);
            savedRecord.set(r);
            return r;
        });
    }

    private LocalHandshakeRequest buildValidHandshakeRequest(String clientIp) throws Exception {
        String qrJson = qrTokenService.generateTeacherQRPayload(
                session.getSessionUuid(),
                teacher.getId(),
                session.getLocalServerIp(),
                session.getLocalServerPort(),
                teacherEdPubB64,
                teacherXPubB64,
                session.getAllowedSubnets(),
                cryptoService.getBackendEd25519PublicKeyBase64(),
                60
        );
        TeacherQRPayload qr = objectMapper.readValue(qrJson, TeacherQRPayload.class);

        String studentNonce = cryptoService.generateNonce(24);
        StudentHandshakeTicketRequest ticketReq = new StudentHandshakeTicketRequest();
        ticketReq.setSessionUuid(session.getSessionUuid());
        ticketReq.setStudentEd25519PublicKey(studentEdPubB64);
        ticketReq.setStudentX25519PublicKey(studentXPubB64);
        ticketReq.setStudentNonce(studentNonce);

        StudentHandshakeTicketResponse ticket = localHandshakeService.issueHandshakeTicket(
                ticketReq, "student1", Map.of());

        // Verify backend Ed25519 attestation signature as companion would
        String canonicalTicket = cryptoService.canonicalStudentTicketMessage(
                ticket.getTicketId(), ticket.getSessionUuid(), ticket.getStudentId(), ticket.getStudentRef(),
                ticket.getStudentEd25519PublicKey(), ticket.getStudentX25519PublicKey(),
                ticket.getStudentNonce(), ticket.getIssuedAt(), ticket.getExpiresAt());
        assertTrue(cryptoService.verifyEd25519Signature(
                cryptoService.getBackendEd25519PublicKeyBase64(), canonicalTicket, ticket.getBackendTicketSignature()));

        // Perform X25519 + HKDF-SHA256 key derivation on both sides
        byte[] studentShared = cryptoService.computeX25519SharedSecret(studentXPair.getPrivate(), teacherXPair.getPublic());
        byte[] teacherShared = cryptoService.computeX25519SharedSecret(teacherXPair.getPrivate(), studentXPair.getPublic());
        assertArrayEquals(studentShared, teacherShared);

        byte[] salt = (ticket.getTicketId() + "|" + session.getSessionUuid()).getBytes(StandardCharsets.UTF_8);
        byte[] info = "smart-erp-local-handshake-v1".getBytes(StandardCharsets.UTF_8);
        byte[] sessionHmacKey = cryptoService.hkdfSha256(studentShared, salt, info, 32);

        String teacherNonce = cryptoService.generateNonce(24);
        long studentProofTs = System.currentTimeMillis();
        String canonicalProof = cryptoService.canonicalStudentProofMessage(
                session.getSessionUuid(), ticket.getTicketId(), ticket.getStudentRef(),
                studentNonce, teacherNonce, teacherEdPubB64, teacherXPubB64, studentProofTs);
        String studentProofSig = cryptoService.signEd25519(studentEdPair.getPrivate(), canonicalProof);

        String companionReceiptId = "HSR-" + UUID.randomUUID();
        long receiptIssued = System.currentTimeMillis();
        long receiptExpires = receiptIssued + 60_000L;
        String canonicalReceipt = cryptoService.canonicalCompanionReceiptMessage(
                companionReceiptId, session.getSessionUuid(), teacher.getId(), ticket.getStudentRef(),
                ticket.getTicketId(), teacherNonce, studentNonce, clientIp,
                teacherEdPubB64, teacherXPubB64, studentEdPubB64, studentXPubB64,
                receiptIssued, receiptExpires);
        String teacherReceiptSig = cryptoService.signEd25519(teacherEdPair.getPrivate(), canonicalReceipt);
        String receiptHmac = cryptoService.computeHmacSha256Base64(sessionHmacKey, canonicalReceipt);

        LocalHandshakeRequest req = new LocalHandshakeRequest();
        req.setSessionUuid(session.getSessionUuid());
        req.setTeacherId(teacher.getId());
        req.setStudentRef(ticket.getStudentRef());
        req.setTicketId(ticket.getTicketId());
        req.setNonce(qr.getNonce());
        req.setTeacherNonce(teacherNonce);
        req.setStudentNonce(studentNonce);
        req.setTimestamp(qr.getTimestamp());
        req.setExpiresAt(qr.getExpiresAt());
        req.setStudentProofTimestamp(studentProofTs);
        req.setReceiptIssuedAt(receiptIssued);
        req.setReceiptExpiresAt(receiptExpires);
        req.setQrSignature(qr.getSignature());
        req.setClientIp(clientIp);
        req.setCompanionReceiptId(companionReceiptId);
        req.setTeacherEd25519PublicKey(teacherEdPubB64);
        req.setTeacherX25519PublicKey(teacherXPubB64);
        req.setStudentEd25519PublicKey(studentEdPubB64);
        req.setStudentX25519PublicKey(studentXPubB64);
        req.setTeacherReceiptSignature(teacherReceiptSig);
        req.setStudentProofSignature(studentProofSig);
        req.setReceiptHmac(receiptHmac);
        return req;
    }

    @Test
    void validEndToEndCryptographicHandshakeSucceeds() throws Exception {
        LocalHandshakeRequest req = buildValidHandshakeRequest("192.168.1.45");
        LocalHandshakeResponse res = localHandshakeService.verifyHandshake(req, "student1", Map.of());

        assertTrue(res.isVerified());
        assertEquals("VERIFIED", res.getStatus());
        assertEquals(req.getCompanionReceiptId(), res.getReceiptId());
        assertNotNull(savedRecord.get());
        assertEquals("192.168.1.45", savedRecord.get().getClientIp());
    }

    @Test
    void blocksTicketAndHandshakeWithoutOpenCampusCheckIn() throws Exception {
        doThrow(new RuntimeException("Campus check-in required")).when(campusCheckInService).requireOpenCampusCheckIn(student);

        StudentHandshakeTicketRequest ticketReq = new StudentHandshakeTicketRequest();
        ticketReq.setSessionUuid(session.getSessionUuid());
        ticketReq.setStudentEd25519PublicKey(studentEdPubB64);
        ticketReq.setStudentX25519PublicKey(studentXPubB64);
        ticketReq.setStudentNonce(cryptoService.generateNonce(24));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                localHandshakeService.issueHandshakeTicket(ticketReq, "student1", Map.of()));
        assertTrue(ex.getMessage().contains("Campus check-in required"));
    }

    @Test
    void rejectsInvalidQrSignature() throws Exception {
        LocalHandshakeRequest req = buildValidHandshakeRequest("192.168.1.45");
        req.setQrSignature("tampered-signature");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                localHandshakeService.verifyHandshake(req, "student1", Map.of()));
        assertTrue(ex.getMessage().contains("QR signature"));
    }

    @Test
    void rejectsExpiredQrPayload() throws Exception {
        LocalHandshakeRequest req = buildValidHandshakeRequest("192.168.1.45");
        req.setTimestamp(System.currentTimeMillis() - 120_000L);
        req.setExpiresAt(System.currentTimeMillis() - 60_000L);

        assertThrows(RuntimeException.class, () ->
                localHandshakeService.verifyHandshake(req, "student1", Map.of()));
    }

    @Test
    void rejectsReusedNonceAndReplayAttack() throws Exception {
        LocalHandshakeRequest req = buildValidHandshakeRequest("192.168.1.45");
        localHandshakeService.verifyHandshake(req, "student1", Map.of());

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                localHandshakeService.verifyHandshake(req, "student1", Map.of()));
        assertTrue(ex.getMessage().toLowerCase().contains("replay"));
    }

    @Test
    void rejectsModifiedCompanionReceiptPayload() throws Exception {
        LocalHandshakeRequest req = buildValidHandshakeRequest("192.168.1.45");
        // Attacker alters clientIp inside same subnet without re-signing with teacher private key
        req.setClientIp("192.168.1.99");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                localHandshakeService.verifyHandshake(req, "student1", Map.of()));
        assertTrue(ex.getMessage().contains("Teacher Companion Ed25519 receipt signature"));
    }

    @Test
    void rejectsWrongTeacherKey() throws Exception {
        LocalHandshakeRequest req = buildValidHandshakeRequest("192.168.1.45");
        KeyPair rogueTeacher = KeyPairGenerator.getInstance("Ed25519").generateKeyPair();
        req.setTeacherEd25519PublicKey(Base64.getEncoder().encodeToString(rogueTeacher.getPublic().getEncoded()));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                localHandshakeService.verifyHandshake(req, "student1", Map.of()));
        assertTrue(ex.getMessage().contains("Teacher companion public key mismatch"));
    }

    @Test
    void rejectsWrongStudentReference() throws Exception {
        LocalHandshakeRequest req = buildValidHandshakeRequest("192.168.1.45");
        req.setStudentRef("REG-FAKE-999");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                localHandshakeService.verifyHandshake(req, "student1", Map.of()));
        assertTrue(ex.getMessage().contains("Student identity reference mismatch"));
    }

    @Test
    void rejectsPublicExternalIp() throws Exception {
        LocalHandshakeRequest req = buildValidHandshakeRequest("8.8.8.8");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                localHandshakeService.verifyHandshake(req, "student1", Map.of()));
        assertTrue(ex.getMessage().contains("private RFC 1918"));
    }

    @Test
    void rejectsNonAllowlistedSubnet() throws Exception {
        LocalHandshakeRequest req = buildValidHandshakeRequest("192.168.99.50");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                localHandshakeService.verifyHandshake(req, "student1", Map.of()));
        assertTrue(ex.getMessage().contains("outside allowlisted classroom LAN subnets"));
    }

    @Test
    void rejectsProxyAndForwardedHeaders() throws Exception {
        LocalHandshakeRequest req = buildValidHandshakeRequest("192.168.1.45");

        for (String header : List.of("X-Forwarded-For", "Forwarded", "Via", "X-Real-IP")) {
            RuntimeException ex = assertThrows(RuntimeException.class, () ->
                    localHandshakeService.verifyHandshake(req, "student1", Map.of(header, "203.0.113.10")));
            assertTrue(ex.getMessage().contains("Proxy or forwarded header rejected"));
        }
    }

    @Test
    void rejectsExpiredHandshakeReceipt() throws Exception {
        LocalHandshakeRequest req = buildValidHandshakeRequest("192.168.1.45");
        req.setReceiptIssuedAt(System.currentTimeMillis() - 300_000L);
        req.setReceiptExpiresAt(System.currentTimeMillis() - 1000L);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                localHandshakeService.verifyHandshake(req, "student1", Map.of()));
        assertTrue(ex.getMessage().contains("expired"));
    }

    @Test
    void handlesConcurrentHandshakeRequestsAtomically() throws Exception {
        LocalHandshakeRequest req1 = buildValidHandshakeRequest("192.168.1.45");
        LocalHandshakeRequest req2 = buildValidHandshakeRequest("192.168.1.46");

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        List<Future<Boolean>> futures = new ArrayList<>();
        for (LocalHandshakeRequest r : List.of(req1, req2)) {
            futures.add(pool.submit(() -> {
                ready.countDown();
                start.await();
                try {
                    localHandshakeService.verifyHandshake(r, "student1", Map.of());
                    return true;
                } catch (RuntimeException e) {
                    return false;
                }
            }));
        }

        ready.await();
        start.countDown();

        int successes = 0;
        int rejections = 0;
        for (Future<Boolean> f : futures) {
            if (Boolean.TRUE.equals(f.get())) successes++;
            else rejections++;
        }
        pool.shutdown();

        assertEquals(1, successes);
        assertEquals(1, rejections);
    }
}
