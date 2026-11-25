package com.Smart.Erp.Modules.Attendance.Controller;

import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Academic.Repo.*;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.FaceVerificationSession;
import com.Smart.Erp.Modules.Attendance.Enum.VerificationState;
import com.Smart.Erp.Modules.Attendance.Repo.*;
import com.Smart.Erp.Modules.Attendance.Services.CryptographicHandshakeService;
import com.Smart.Erp.Modules.SecurityGuard.Entity.SecurityGuard;
import com.Smart.Erp.Modules.SecurityGuard.Repo.SecurityGuardRepo;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Subject.Repo.SubjectRepo;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import com.Smart.Erp.Security.CustomUserDetailService;
import com.Smart.Erp.Security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.Filter;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("local")
@Transactional
class AttendanceEndpointsIntegrationTest {

    @Autowired private WebApplicationContext wac;
    @Autowired @Qualifier("springSecurityFilterChain") private Filter springSecurityFilterChain;
    @Autowired private JwtService jwtService;
    @Autowired private CustomUserDetailService userDetailService;
    @Autowired private CryptographicHandshakeService cryptoService;

    @Autowired private UniversityRepo universityRepo;
    @Autowired private SchoolRepo schoolRepo;
    @Autowired private DepartmentRepo departmentRepo;
    @Autowired private AcademicYearRepository academicYearRepository;
    @Autowired private CourseRepo courseRepo;
    @Autowired private SpecializationRepo specializationRepo;
    @Autowired private SectionRepo sectionRepo;
    @Autowired private SectionGroupRepo sectionGroupRepo;
    @Autowired private SubjectRepo subjectRepo;
    @Autowired private UserRepo userRepo;
    @Autowired private StudentRepo studentRepo;
    @Autowired private StudentEnrollmentRepo studentEnrollmentRepo;
    @Autowired private TeacherRepo teacherRepo;
    @Autowired private SecurityGuardRepo securityGuardRepo;
    @Autowired private AttendanceSessionRepository sessionRepository;
    @Autowired private FaceVerificationSessionRepository faceVerificationSessionRepository;
    @Autowired private StudentAttendanceRepository studentAttendanceRepository;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String studentToken;
    private String teacherToken;
    private String guardToken;

    private AcademicYear academicYear;
    private Course course;
    private Section section;
    private Subject subject;
    private Student student;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .addFilters(springSecurityFilterChain)
                .build();

        String uid = UUID.randomUUID().toString().replace("-", "").substring(0, 8);

        University uni = universityRepo.save(University.builder()
                .name("Test Uni " + uid)
                .code("TU" + uid)
                .build());
        School school = schoolRepo.save(School.builder()
                .name("SoE " + uid)
                .code("SOE" + uid)
                .university(uni)
                .build());
        Department dept = departmentRepo.save(Department.builder()
                .name("CSE " + uid)
                .code("CSE" + uid)
                .school(school)
                .build());
        academicYear = academicYearRepository.save(AcademicYear.builder()
                .name("AY-" + uid)
                .code("AY" + uid)
                .activeStatus(ActiveStatus.ENABLE)
                .university(uni)
                .build());
        course = courseRepo.save(Course.builder()
                .name("B.Tech " + uid)
                .code("BT" + uid)
                .activeStatus(ActiveStatus.ENABLE)
                .newEnrollmentAllowed(true)
                .department(dept)
                .build());
        section = sectionRepo.save(Section.builder()
                .name("Sec-" + uid)
                .code("SEC" + uid)
                .capacity(60)
                .activeStatus(ActiveStatus.ENABLE)
                .academicYear(academicYear)
                .course(course)
                .build());
        SectionGroup sg = sectionGroupRepo.save(SectionGroup.builder()
                .name("SG-" + uid)
                .section(section)
                .build());
        subject = subjectRepo.save(Subject.builder()
                .name("Algorithms " + uid)
                .code("ALG" + uid)
                .activeStatus(ActiveStatus.ENABLE)
                .course(course)
                .build());

        User sUser = createUser("stu_" + uid, "Stu", "One", UserRoles.STUDENT, uni);
        student = studentRepo.save(Student.builder()
                .registrationNumber("REG-" + uid)
                .user(sUser)
                .build());
        StudentEnrollment sEnroll = new StudentEnrollment();
        sEnroll.setStudent(student);
        sEnroll.setSectionGroup(sg);
        sEnroll.setRollNumber("R-" + uid);
        sEnroll.setStatus(EnrollmentStatus.ACTIVE);
        studentEnrollmentRepo.save(sEnroll);

        User tUser = createUser("tch_" + uid, "Dr", "Prof", UserRoles.TEACHER, uni);
        teacherRepo.save(Teacher.builder().user(tUser).build());

        User gUser = createUser("grd_" + uid, "Gate", "Officer", UserRoles.SECURITY_GUARD, uni);
        securityGuardRepo.save(SecurityGuard.builder()
                .user(gUser)
                .badgeNumber("BG-" + uid)
                .assignedGate("Main Gate")
                .build());

        studentToken = jwtService.generateToken(userDetailService.loadUserByUsername(sUser.getUsername()));
        teacherToken = jwtService.generateToken(userDetailService.loadUserByUsername(tUser.getUsername()));
        guardToken = jwtService.generateToken(userDetailService.loadUserByUsername(gUser.getUsername()));
    }

    private User createUser(String username, String first, String last, UserRoles role, University uni) {
        User u = User.builder()
                .username(username)
                .password("encoded-pass")
                .enabled(true)
                .userRole(role)
                .university(uni)
                .build();
        BasicDetail bd = BasicDetail.builder()
                .firstName(first)
                .lastName(last)
                .email(username + "@example.edu")
                .phone("9000000000")
                .user(u)
                .build();
        u.setBasicDetail(bd);
        return userRepo.save(u);
    }

    @Test
    void enforcesRoleAuthorizationAcrossAllAttendanceAndCampusEndpoints() throws Exception {
        // Unauthenticated requests blocked
        mockMvc.perform(get("/student/campus-check-in/status")).andExpect(status().isForbidden());
        mockMvc.perform(get("/teacher/campus-check-in/status")).andExpect(status().isForbidden());
        mockMvc.perform(get("/security-guard/campus-check-in/recent")).andExpect(status().isForbidden());

        // Cross-role access blocked
        mockMvc.perform(get("/teacher/campus-check-in/status")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/security-guard/campus-check-in/scan")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"qrToken\":\"CMP-FAKE\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/student/campus-check-in/status")
                        .header("Authorization", "Bearer " + guardToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void executesFullEndToEndHttpWorkflowAcrossCampusGateSessionHandshakeAndGuardAttendance() throws Exception {
        long initialAttendanceCount = studentAttendanceRepository.count();

        // 1. Teacher Campus Check-In -> Guard Scan -> Guard Approve -> Teacher Check-Out -> Does NOT touch StudentAttendance
        MvcResult tQrRes = mockMvc.perform(post("/teacher/campus-check-in/qr")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"direction\":\"CHECK_IN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personRole").value("TEACHER"))
                .andExpect(jsonPath("$.direction").value("CHECK_IN"))
                .andReturn();
        String teacherInToken = objectMapper.readTree(tQrRes.getResponse().getContentAsString()).get("qrToken").asText();

        mockMvc.perform(post("/security-guard/campus-check-in/scan")
                        .header("Authorization", "Bearer " + guardToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("qrToken", teacherInToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personRole").value("TEACHER"))
                .andExpect(jsonPath("$.employeeId").isNotEmpty());

        mockMvc.perform(post("/security-guard/campus-check-in/decision")
                        .header("Authorization", "Bearer " + guardToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "qrToken", teacherInToken,
                                "approved", true,
                                "deviceDetails", "North Gate"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("APPROVED"));

        MvcResult tOutQrRes = mockMvc.perform(post("/teacher/campus-check-in/qr")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"direction\":\"CHECK_OUT\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String teacherOutToken = objectMapper.readTree(tOutQrRes.getResponse().getContentAsString()).get("qrToken").asText();

        mockMvc.perform(post("/security-guard/campus-check-in/decision")
                        .header("Authorization", "Bearer " + guardToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "qrToken", teacherOutToken,
                                "approved", true,
                                "deviceDetails", "North Gate"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.direction").value("CHECK_OUT"));

        assertEquals(initialAttendanceCount, studentAttendanceRepository.count());

        // 2. Teacher starts cryptographic classroom attendance session & refreshes QR
        KeyPairGenerator edGen = KeyPairGenerator.getInstance("Ed25519");
        KeyPairGenerator xGen = KeyPairGenerator.getInstance("X25519");
        KeyPair teacherEd = edGen.generateKeyPair();
        KeyPair teacherX = xGen.generateKeyPair();
        String teacherEdPub = Base64.getEncoder().encodeToString(teacherEd.getPublic().getEncoded());
        String teacherXPub = Base64.getEncoder().encodeToString(teacherX.getPublic().getEncoded());

        MvcResult sessRes = mockMvc.perform(post("/teacher/attendance/sessions/start")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "academicYearId", academicYear.getId(),
                                "courseId", course.getId(),
                                "sectionId", section.getId(),
                                "subjectId", subject.getId(),
                                "roomNumber", "LH-402",
                                "localServerIp", "10.20.30.40",
                                "localServerPort", 8443,
                                "teacherEd25519PublicKey", teacherEdPub,
                                "teacherX25519PublicKey", teacherXPub,
                                "allowedSubnets", "10.20.30.0/24"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.allowedSubnets").value("10.20.30.0/24"))
                .andReturn();
        JsonNode sessJson = objectMapper.readTree(sessRes.getResponse().getContentAsString());
        String sessionUuid = sessJson.get("sessionUuid").asText();
        JsonNode qrObj = objectMapper.readTree(sessJson.get("qrPayload").asText());

        mockMvc.perform(get("/teacher/attendance/sessions/active")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionUuid").value(sessionUuid));

        mockMvc.perform(post("/teacher/attendance/sessions/" + sessionUuid + "/qr/refresh")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qrPayload").isNotEmpty());

        // 3. Before Campus Check-In, classroom attendance handshake ticket is BLOCKED
        KeyPair studentEd = edGen.generateKeyPair();
        KeyPair studentX = xGen.generateKeyPair();
        String studentEdPub = Base64.getEncoder().encodeToString(studentEd.getPublic().getEncoded());
        String studentXPub = Base64.getEncoder().encodeToString(studentX.getPublic().getEncoded());
        String studentNonce = cryptoService.generateNonce(24);

        mockMvc.perform(post("/student/attendance/handshake/ticket")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "sessionUuid", sessionUuid,
                                "studentEd25519PublicKey", studentEdPub,
                                "studentX25519PublicKey", studentXPub,
                                "studentNonce", studentNonce
                        ))))
                .andExpect(status().isConflict());

        // 4. Student performs Campus Check-In -> Guard Scan -> Guard Approve
        MvcResult sQrRes = mockMvc.perform(post("/student/campus-check-in/qr")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"direction\":\"CHECK_IN\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String studentCampusToken = objectMapper.readTree(sQrRes.getResponse().getContentAsString()).get("qrToken").asText();

        mockMvc.perform(post("/security-guard/campus-check-in/scan")
                        .header("Authorization", "Bearer " + guardToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("qrToken", studentCampusToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personRole").value("STUDENT"))
                .andExpect(jsonPath("$.sectionName").value(section.getName()));

        mockMvc.perform(post("/security-guard/campus-check-in/decision")
                        .header("Authorization", "Bearer " + guardToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "qrToken", studentCampusToken,
                                "approved", true,
                                "deviceDetails", "Main Gate"))))
                .andExpect(status().isOk());

        // 5. Seed PASSED biometric session -> execute cryptographic ticket + companion handshake HTTP verify
        AttendanceSession sessionEntity = sessionRepository.findBySessionUuid(sessionUuid).orElseThrow();
        faceVerificationSessionRepository.save(FaceVerificationSession.builder()
                .sessionId("FVS-" + UUID.randomUUID())
                .attendanceSession(sessionEntity)
                .student(student)
                .challengeSequence("LOOK_STRAIGHT,TURN_LEFT,SMILE")
                .currentChallengeIndex(3)
                .status(VerificationState.PASSED)
                .matchedSimilarity(0.89)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build());

        MvcResult ticketMvc = mockMvc.perform(post("/student/attendance/handshake/ticket")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "sessionUuid", sessionUuid,
                                "studentEd25519PublicKey", studentEdPub,
                                "studentX25519PublicKey", studentXPub,
                                "studentNonce", studentNonce
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.backendTicketSignature").isNotEmpty())
                .andReturn();
        JsonNode ticketJson = objectMapper.readTree(ticketMvc.getResponse().getContentAsString());

        String ticketId = ticketJson.get("ticketId").asText();
        String studentRef = ticketJson.get("studentRef").asText();
        String teacherNonce = cryptoService.generateNonce(24);
        long studentProofTs = System.currentTimeMillis();
        String proofMsg = cryptoService.canonicalStudentProofMessage(
                sessionUuid, ticketId, studentRef, studentNonce, teacherNonce,
                teacherEdPub, teacherXPub, studentProofTs);
        String studentProofSig = cryptoService.signEd25519(studentEd.getPrivate(), proofMsg);

        byte[] shared = cryptoService.computeX25519SharedSecret(teacherX.getPrivate(), studentX.getPublic());
        byte[] hmacKey = cryptoService.hkdfSha256(
                shared,
                (ticketId + "|" + sessionUuid).getBytes(StandardCharsets.UTF_8),
                "smart-erp-local-handshake-v1".getBytes(StandardCharsets.UTF_8),
                32
        );
        String companionReceiptId = "HSR-" + UUID.randomUUID();
        long receiptIssued = System.currentTimeMillis();
        long receiptExpires = receiptIssued + 60_000L;
        String canonicalReceipt = cryptoService.canonicalCompanionReceiptMessage(
                companionReceiptId, sessionUuid, qrObj.get("teacherId").asLong(), studentRef,
                ticketId, teacherNonce, studentNonce, "10.20.30.55",
                teacherEdPub, teacherXPub, studentEdPub, studentXPub,
                receiptIssued, receiptExpires
        );
        String receiptSig = cryptoService.signEd25519(teacherEd.getPrivate(), canonicalReceipt);
        String receiptHmac = cryptoService.computeHmacSha256Base64(hmacKey, canonicalReceipt);

        String handshakeBody = objectMapper.writeValueAsString(Map.ofEntries(
                Map.entry("sessionUuid", sessionUuid),
                Map.entry("teacherId", qrObj.get("teacherId").asLong()),
                Map.entry("studentRef", studentRef),
                Map.entry("ticketId", ticketId),
                Map.entry("nonce", qrObj.get("nonce").asText()),
                Map.entry("teacherNonce", teacherNonce),
                Map.entry("studentNonce", studentNonce),
                Map.entry("timestamp", qrObj.get("timestamp").asLong()),
                Map.entry("expiresAt", qrObj.get("expiresAt").asLong()),
                Map.entry("studentProofTimestamp", studentProofTs),
                Map.entry("receiptIssuedAt", receiptIssued),
                Map.entry("receiptExpiresAt", receiptExpires),
                Map.entry("qrSignature", qrObj.get("signature").asText()),
                Map.entry("clientIp", "10.20.30.55"),
                Map.entry("companionReceiptId", companionReceiptId),
                Map.entry("teacherEd25519PublicKey", teacherEdPub),
                Map.entry("teacherX25519PublicKey", teacherXPub),
                Map.entry("studentEd25519PublicKey", studentEdPub),
                Map.entry("studentX25519PublicKey", studentXPub),
                Map.entry("teacherReceiptSignature", receiptSig),
                Map.entry("studentProofSignature", studentProofSig),
                Map.entry("receiptHmac", receiptHmac)
        ));

        // Request carrying proxy header X-Forwarded-For must be rejected (409) BEFORE consuming ticket/nonce
        mockMvc.perform(post("/student/attendance/handshake/verify")
                        .header("Authorization", "Bearer " + studentToken)
                        .header("X-Forwarded-For", "198.51.100.22")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(handshakeBody))
                .andExpect(status().isConflict());

        // Direct request succeeds (200 OK)
        mockMvc.perform(post("/student/attendance/handshake/verify")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(handshakeBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));

        // 6. Classroom Gate Check-In QR -> Security Guard Scan & Approve -> Attendance Marked
        MvcResult checkInQrMvc = mockMvc.perform(get("/student/attendance/checkin/qr")
                        .header("Authorization", "Bearer " + studentToken)
                        .param("sessionUuid", sessionUuid))
                .andExpect(status().isOk())
                .andReturn();
        String classCheckInToken = objectMapper.readTree(checkInQrMvc.getResponse().getContentAsString()).get("checkInToken").asText();

        mockMvc.perform(post("/security-guard/check-in/scan")
                        .header("Authorization", "Bearer " + guardToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("checkInToken", classCheckInToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.faceVerificationPassed").value(true))
                .andExpect(jsonPath("$.handshakeVerified").value(true));

        mockMvc.perform(post("/security-guard/check-in/decision")
                        .header("Authorization", "Bearer " + guardToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "checkInToken", classCheckInToken,
                                "approved", true,
                                "deviceDetails", "Classroom Gate"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attendanceMarked").value(true));

        mockMvc.perform(get("/teacher/attendance/sessions/" + sessionUuid + "/stats")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPresent").value(1));

        mockMvc.perform(post("/teacher/attendance/sessions/" + sessionUuid + "/stop")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }
}
