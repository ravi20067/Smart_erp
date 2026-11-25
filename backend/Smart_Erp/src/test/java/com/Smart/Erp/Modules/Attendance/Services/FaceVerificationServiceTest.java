package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Attendance.DTO.StudentVerificationStartResponse;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.FaceVerificationSession;
import com.Smart.Erp.Modules.Attendance.Entity.StudentFaceTemplate;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import com.Smart.Erp.Modules.Attendance.Enum.LivenessChallenge;
import com.Smart.Erp.Modules.Attendance.Repo.AttendanceSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.FaceVerificationAttemptRepository;
import com.Smart.Erp.Modules.Attendance.Repo.FaceVerificationSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.StudentAttendanceRepository;
import com.Smart.Erp.Modules.Attendance.Repo.StudentFaceTemplateRepository;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FaceVerificationServiceTest {

    @Mock private FaceVerificationSessionRepository verificationSessionRepository;
    @Mock private FaceVerificationAttemptRepository attemptRepository;
    @Mock private StudentFaceTemplateRepository faceTemplateRepository;
    @Mock private AttendanceSessionRepository sessionRepository;
    @Mock private StudentAttendanceRepository attendanceRepository;
    @Mock private StudentRepo studentRepo;
    @Mock private StudentEnrollmentRepo studentEnrollmentRepo;
    @Mock private UserRepo userRepo;
    @Mock private ChallengeGenerationService challengeGenerationService;
    @Mock private PythonFaceAiClient pythonFaceAiClient;
    @Mock private BiometricEncryptionService biometricEncryptionService;
    @Mock private AttendanceWebSocketPublisher webSocketPublisher;
    @Mock private AttendanceAuditService auditService;
    @Mock private CampusCheckInService campusCheckInService;

    @InjectMocks
    private FaceVerificationService faceVerificationService;

    private User user;
    private Student student;
    private Section section;
    private AttendanceSession attendanceSession;

    @BeforeEach
    void setUp() {
        user = User.builder().id(10L).username("student1").build();
        student = Student.builder().id(20L).registrationNumber("REG-2026-001").user(user).build();
        section = Section.builder().id(30L).name("CSE-A").build();
        SectionGroup group = SectionGroup.builder().id(40L).name("G1").section(section).build();

        StudentEnrollment enrollment = new StudentEnrollment();
        enrollment.setSectionGroup(group);

        attendanceSession = AttendanceSession.builder()
                .id(50L)
                .sessionUuid("SESS-UUID-1")
                .section(section)
                .status(AttendanceSessionStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();

        when(userRepo.findByUsername("student1")).thenReturn(Optional.of(user));
        when(studentRepo.findByUser(user)).thenReturn(Optional.of(student));
        when(sessionRepository.findBySessionUuid("SESS-UUID-1")).thenReturn(Optional.of(attendanceSession));
        when(attendanceRepository.existsByAttendanceSessionAndStudent(attendanceSession, student)).thenReturn(false);
        when(studentEnrollmentRepo.findAllByStudent(student)).thenReturn(List.of(enrollment));
    }

    @Test
    void startVerificationBlocksStudentWithoutAdminEnrolledFaceTemplate() {
        when(faceTemplateRepository.findByStudent(student)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                faceVerificationService.startVerification("SESS-UUID-1", "student1"));

        assertTrue(ex.getMessage().contains("Biometric face template is not registered"));
        verify(verificationSessionRepository, never()).save(any(FaceVerificationSession.class));
        verify(pythonFaceAiClient, never()).createSession(anyString(), anyString(), anyInt());
    }

    @Test
    void startVerificationBlocksStudentWithInactiveTemplate() {
        StudentFaceTemplate disabledTemplate = StudentFaceTemplate.builder()
                .id(1L)
                .student(student)
                .status("DISABLED")
                .encryptedEmbedding("enc-vec")
                .build();
        when(faceTemplateRepository.findByStudent(student)).thenReturn(Optional.of(disabledTemplate));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                faceVerificationService.startVerification("SESS-UUID-1", "student1"));

        assertTrue(ex.getMessage().contains("Biometric face template is not registered"));
        verifyNoInteractions(pythonFaceAiClient);
    }

    @Test
    void startVerificationSucceedsWhenSuperAdminTemplateIsActive() {
        StudentFaceTemplate activeTemplate = StudentFaceTemplate.builder()
                .id(1L)
                .student(student)
                .status("ACTIVE")
                .encryptedEmbedding("encrypted-128d-vector")
                .enrolledAt(LocalDateTime.now())
                .build();

        when(faceTemplateRepository.findByStudent(student)).thenReturn(Optional.of(activeTemplate));
        when(challengeGenerationService.generateChallengeSequence())
                .thenReturn(List.of(LivenessChallenge.LOOK_STRAIGHT, LivenessChallenge.TURN_LEFT));
        when(challengeGenerationService.serializeSequence(any())).thenReturn("LOOK_STRAIGHT,TURN_LEFT");

        StudentVerificationStartResponse response = faceVerificationService.startVerification("SESS-UUID-1", "student1");

        assertNotNull(response.getVerificationSessionId());
        assertEquals("LOOK_STRAIGHT", response.getCurrentChallenge());
        assertEquals(2, response.getTotalChallenges());
        verify(verificationSessionRepository).save(any(FaceVerificationSession.class));
        verify(pythonFaceAiClient).createSession(anyString(), eq("LOOK_STRAIGHT"), eq(120));
    }

    @Test
    void startVerificationBlocksStudentWithoutApprovedOpenCampusCheckIn() {
        doThrow(new RuntimeException("Campus check-in required: Please complete Security Guard Campus Check-In before classroom attendance."))
                .when(campusCheckInService).requireOpenCampusCheckIn(student);

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                faceVerificationService.startVerification("SESS-UUID-1", "student1"));

        assertTrue(ex.getMessage().contains("Campus check-in required"));
        verifyNoInteractions(faceTemplateRepository, pythonFaceAiClient);
    }
}
