package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Department;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import com.Smart.Erp.Modules.Attendance.DTO.CampusDecisionRequest;
import com.Smart.Erp.Modules.Attendance.DTO.CampusDecisionResponse;
import com.Smart.Erp.Modules.Attendance.DTO.CampusGuardScanResponse;
import com.Smart.Erp.Modules.Attendance.DTO.CampusQrResponse;
import com.Smart.Erp.Modules.Attendance.DTO.CampusStatusResponse;
import com.Smart.Erp.Modules.Attendance.Entity.CampusCheckInRecord;
import com.Smart.Erp.Modules.Attendance.Enum.CampusCheckDirection;
import com.Smart.Erp.Modules.Attendance.Enum.CampusPersonRole;
import com.Smart.Erp.Modules.Attendance.Enum.GuardCheckInState;
import com.Smart.Erp.Modules.Attendance.Repo.CampusCheckInRepository;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.SecurityGuard.Entity.SecurityGuard;
import com.Smart.Erp.Modules.SecurityGuard.Repo.SecurityGuardRepo;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.User.Entity.Role;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Entity.UserRole;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CampusCheckInServiceTest {

    @Mock private CampusCheckInRepository campusRepo;
    @Mock private UserRepo userRepo;
    @Mock private StudentRepo studentRepo;
    @Mock private StudentEnrollmentRepo studentEnrollmentRepo;
    @Mock private TeacherRepo teacherRepo;
    @Mock private SecurityGuardRepo securityGuardRepo;
    @Mock private AttendanceAuditService auditService;
    @Mock private AttendanceWebSocketPublisher webSocketPublisher;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private CampusCheckInService campusCheckInService;

    private final List<CampusCheckInRecord> store = new ArrayList<>();
    private final AtomicLong seq = new AtomicLong(1);
    private final ConcurrentHashMap<String, String> redisStore = new ConcurrentHashMap<>();

    private User studentUser;
    private Student student;
    private User teacherUser;
    private Teacher teacher;
    private User guardUser;
    private SecurityGuard guard;
    private User unauthorizedUser;

    @BeforeEach
    void setUp() {
        store.clear();
        seq.set(1);
        redisStore.clear();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        doAnswer(inv -> {
            redisStore.put(inv.getArgument(0), inv.getArgument(1));
            return null;
        }).when(valueOperations).set(anyString(), anyString(), any(Duration.class));
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class)))
                .thenAnswer(inv -> redisStore.putIfAbsent(inv.getArgument(0), inv.getArgument(1)) == null);
        when(redisTemplate.delete(anyString())).thenAnswer(inv -> redisStore.remove(inv.getArgument(0)) != null);

        // Stateful repository backing
        when(campusRepo.save(any(CampusCheckInRecord.class))).thenAnswer(inv -> {
            CampusCheckInRecord rec = inv.getArgument(0);
            if (rec.getId() == null) {
                rec.setId(seq.getAndIncrement());
                store.add(rec);
            }
            return rec;
        });
        when(campusRepo.findByQrToken(anyString())).thenAnswer(inv ->
                store.stream().filter(r -> Objects.equals(r.getQrToken(), inv.getArgument(0))).findFirst());
        when(campusRepo.findAllByUserOrderByRequestedAtDesc(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return store.stream()
                    .filter(r -> Objects.equals(r.getUser().getId(), u.getId()))
                    .sorted((a, b) -> b.getRequestedAt().compareTo(a.getRequestedAt()))
                    .toList();
        });
        when(campusRepo.findAllByUserAndDirectionAndStatus(any(User.class), any(CampusCheckDirection.class), any(GuardCheckInState.class)))
                .thenAnswer(inv -> store.stream()
                        .filter(r -> Objects.equals(r.getUser().getId(), ((User) inv.getArgument(0)).getId())
                                && r.getDirection() == inv.getArgument(1)
                                && r.getStatus() == inv.getArgument(2))
                        .toList());
        when(campusRepo.findFirstByUserAndDirectionAndStatusAndCheckedOutFalseOrderByActionTimeDesc(
                any(User.class), any(CampusCheckDirection.class), any(GuardCheckInState.class)))
                .thenAnswer(inv -> store.stream()
                        .filter(r -> Objects.equals(r.getUser().getId(), ((User) inv.getArgument(0)).getId())
                                && r.getDirection() == inv.getArgument(1)
                                && r.getStatus() == inv.getArgument(2)
                                && Boolean.FALSE.equals(r.getCheckedOut()))
                        .findFirst());
        when(campusRepo.existsByUserAndDirectionAndStatusAndCheckedOutFalse(
                any(User.class), any(CampusCheckDirection.class), any(GuardCheckInState.class)))
                .thenAnswer(inv -> store.stream()
                        .anyMatch(r -> Objects.equals(r.getUser().getId(), ((User) inv.getArgument(0)).getId())
                                && r.getDirection() == inv.getArgument(1)
                                && r.getStatus() == inv.getArgument(2)
                                && Boolean.FALSE.equals(r.getCheckedOut())));
        when(campusRepo.existsByLinkedCheckInAndStatus(any(CampusCheckInRecord.class), any(GuardCheckInState.class)))
                .thenAnswer(inv -> {
                    CampusCheckInRecord entry = inv.getArgument(0);
                    return store.stream().anyMatch(r -> r.getLinkedCheckIn() != null
                            && Objects.equals(r.getLinkedCheckIn().getId(), entry.getId())
                            && r.getStatus() == inv.getArgument(1));
                });

        FileMetadata studentPhoto = new FileMetadata();
        studentPhoto.setId(UUID.randomUUID());
        studentUser = User.builder()
                .id(10L)
                .username("student1")
                .userRole(UserRoles.STUDENT)
                .basicDetail(BasicDetail.builder().firstName("Riya").lastName("Verma").photo(studentPhoto).build())
                .build();
        student = Student.builder().id(100L).registrationNumber("ENR-2026-009").user(studentUser).build();

        AcademicYear ay = AcademicYear.builder().id(1L).name("2026-2027").build();
        Course course = Course.builder().id(2L).name("B.Tech CSE").build();
        Section section = Section.builder().id(3L).name("CSE-A").academicYear(ay).course(course).build();
        Specialization spec = Specialization.builder().id(4L).name("AI & ML").course(course).build();
        SectionGroup sg = SectionGroup.builder().id(5L).name("G1").section(section).specialization(spec).build();
        StudentEnrollment sEnroll = new StudentEnrollment();
        sEnroll.setRollNumber("26CSE009");
        sEnroll.setStatus(EnrollmentStatus.ACTIVE);
        sEnroll.setSectionGroup(sg);

        FileMetadata teacherPhoto = new FileMetadata();
        teacherPhoto.setId(UUID.randomUUID());
        teacherUser = User.builder()
                .id(20L)
                .username("EMP-FAC-404")
                .userRole(UserRoles.TEACHER)
                .basicDetail(BasicDetail.builder().firstName("Dr. Kabir").lastName("Mehta").photo(teacherPhoto).build())
                .build();
        Department dept = Department.builder().id(11L).name("Computer Science & Engineering").build();
        Course deptCourse = Course.builder().id(12L).name("B.Tech").department(dept).build();
        Subject subj = Subject.builder().id(13L).name("Operating Systems").course(deptCourse).build();
        TeacherEnrollment tEnroll = new TeacherEnrollment();
        tEnroll.setStatus(EnrollmentStatus.ACTIVE);
        tEnroll.getSubjects().add(subj);

        Role profRole = Role.builder().id(1L).name("Associate Professor").build();
        UserRole ur = UserRole.builder().user(teacherUser).role(profRole).build();
        teacherUser.getRoles().add(ur);

        teacher = Teacher.builder().id(200L).user(teacherUser).build();
        teacher.getEnrollments().add(tEnroll);

        guardUser = User.builder()
                .id(30L)
                .username("guard1")
                .userRole(UserRoles.SECURITY_GUARD)
                .basicDetail(BasicDetail.builder().firstName("Vikram").lastName("Singh").build())
                .build();
        guard = SecurityGuard.builder().id(300L).user(guardUser).badgeNumber("GRD-07").build();

        unauthorizedUser = User.builder()
                .id(40L)
                .username("outsider")
                .userRole(UserRoles.STUDENT)
                .build();

        when(userRepo.findByUsername("student1")).thenReturn(Optional.of(studentUser));
        when(studentRepo.findByUser(studentUser)).thenReturn(Optional.of(student));
        when(studentEnrollmentRepo.findAllByStudent(student)).thenReturn(List.of(sEnroll));

        when(userRepo.findByUsername("EMP-FAC-404")).thenReturn(Optional.of(teacherUser));
        when(teacherRepo.findByUser(teacherUser)).thenReturn(Optional.of(teacher));

        when(userRepo.findByUsername("guard1")).thenReturn(Optional.of(guardUser));
        when(securityGuardRepo.findByUser(guardUser)).thenReturn(Optional.of(guard));

        when(userRepo.findByUsername("outsider")).thenReturn(Optional.of(unauthorizedUser));
        when(securityGuardRepo.findByUser(unauthorizedUser)).thenReturn(Optional.empty());
    }

    @Test
    void studentCampusCheckInAndClassroomDependencyLifecycle() {
        // Initially outside campus -> classroom attendance blocked
        assertFalse(campusCheckInService.hasActiveOpenCampusCheckIn(student));
        assertThrows(OperationNotAllowedException.class, () ->
                campusCheckInService.requireOpenCampusCheckIn(student));

        // 1. Student requests Check-In QR -> Guard scans -> verifies student details & approves
        CampusQrResponse qr = campusCheckInService.generateQr("student1", CampusPersonRole.STUDENT, CampusCheckDirection.CHECK_IN);
        assertEquals(CampusPersonRole.STUDENT, qr.getPersonRole());
        assertEquals(CampusCheckDirection.CHECK_IN, qr.getDirection());

        CampusGuardScanResponse scan = campusCheckInService.scanCampusQr(qr.getQrData(), "guard1");
        assertEquals("Riya Verma", scan.getFullName());
        assertEquals("ENR-2026-009", scan.getEnrollmentNumber());
        assertEquals("B.Tech CSE", scan.getCourseName());
        assertEquals("CSE-A", scan.getSectionName());
        assertEquals("2026-2027", scan.getAcademicYearName());
        assertTrue(scan.isHasRegisteredPhoto());

        CampusDecisionResponse approved = campusCheckInService.processGuardDecision(
                CampusDecisionRequest.builder().qrToken(qr.getQrToken()).approved(true).deviceDetails("Main Gate 1").build(),
                "guard1"
        );
        assertEquals("APPROVED", approved.getDecision());

        // Now classroom attendance dependency is satisfied
        assertTrue(campusCheckInService.hasActiveOpenCampusCheckIn(student));
        assertDoesNotThrow(() -> campusCheckInService.requireOpenCampusCheckIn(student));

        // 2. Prevent duplicate open Check-In
        assertThrows(OperationNotAllowedException.class, () ->
                campusCheckInService.generateQr("student1", CampusPersonRole.STUDENT, CampusCheckDirection.CHECK_IN));

        // 3. Check-Out -> Approve -> classroom attendance blocked again!
        CampusQrResponse outQr = campusCheckInService.generateQr("student1", CampusPersonRole.STUDENT, CampusCheckDirection.CHECK_OUT);
        CampusDecisionResponse outDecision = campusCheckInService.processGuardDecision(
                CampusDecisionRequest.builder().qrToken(outQr.getQrToken()).approved(true).deviceDetails("Exit Gate 1").build(),
                "guard1"
        );
        assertEquals("APPROVED", outDecision.getDecision());
        assertFalse(campusCheckInService.hasActiveOpenCampusCheckIn(student));
        assertThrows(OperationNotAllowedException.class, () ->
                campusCheckInService.requireOpenCampusCheckIn(student));
    }

    @Test
    void teacherCampusCheckInCheckOutAndMultipleCyclesWithoutStudentAttendanceImpact() {
        // Teacher Cycle 1: Check-In
        CampusQrResponse in1 = campusCheckInService.generateQr("EMP-FAC-404", CampusPersonRole.TEACHER, CampusCheckDirection.CHECK_IN);
        CampusGuardScanResponse scan1 = campusCheckInService.scanCampusQr(in1.getQrToken(), "guard1");
        assertEquals(CampusPersonRole.TEACHER, scan1.getPersonRole());
        assertEquals("EMP-FAC-404", scan1.getEmployeeId());
        assertEquals("Computer Science & Engineering", scan1.getDepartmentName());
        assertEquals("Associate Professor", scan1.getDesignation());
        assertTrue(scan1.isHasRegisteredPhoto());

        campusCheckInService.processGuardDecision(
                CampusDecisionRequest.builder().qrToken(in1.getQrToken()).approved(true).deviceDetails("North Gate").build(),
                "guard1"
        );

        // Teacher Cycle 1: Check-Out
        CampusQrResponse out1 = campusCheckInService.generateQr("EMP-FAC-404", CampusPersonRole.TEACHER, CampusCheckDirection.CHECK_OUT);
        campusCheckInService.processGuardDecision(
                CampusDecisionRequest.builder().qrToken(out1.getQrToken()).approved(true).deviceDetails("North Gate").build(),
                "guard1"
        );

        // Prevent duplicate Check-Out while already checked out
        assertThrows(OperationNotAllowedException.class, () ->
                campusCheckInService.generateQr("EMP-FAC-404", CampusPersonRole.TEACHER, CampusCheckDirection.CHECK_OUT));

        // Teacher Cycle 2 same day: Re-entry Check-In -> Check-Out preserves all historical records
        CampusQrResponse in2 = campusCheckInService.generateQr("EMP-FAC-404", CampusPersonRole.TEACHER, CampusCheckDirection.CHECK_IN);
        campusCheckInService.processGuardDecision(
                CampusDecisionRequest.builder().qrToken(in2.getQrToken()).approved(true).build(),
                "guard1"
        );

        CampusStatusResponse status = campusCheckInService.getStatus("EMP-FAC-404", CampusPersonRole.TEACHER);
        assertTrue(status.isHasActiveOpenCheckIn());
        assertEquals(3, status.getRecentHistory().size());
    }

    @Test
    void blocksCheckOutWithoutCheckInGuardRejectWithReasonAndUnauthorizedRoles() {
        // Check-Out without Check-In rejected
        assertThrows(OperationNotAllowedException.class, () ->
                campusCheckInService.generateQr("student1", CampusPersonRole.STUDENT, CampusCheckDirection.CHECK_OUT));

        // Unauthorized role spoofing rejected
        assertThrows(OperationNotAllowedException.class, () ->
                campusCheckInService.generateQr("student1", CampusPersonRole.TEACHER, CampusCheckDirection.CHECK_IN));
        assertThrows(OperationNotAllowedException.class, () ->
                campusCheckInService.generateQr("EMP-FAC-404", CampusPersonRole.STUDENT, CampusCheckDirection.CHECK_IN));

        CampusQrResponse qr = campusCheckInService.generateQr("student1", CampusPersonRole.STUDENT, CampusCheckDirection.CHECK_IN);

        // Non-guard cannot scan or approve
        assertThrows(OperationNotAllowedException.class, () ->
                campusCheckInService.scanCampusQr(qr.getQrToken(), "outsider"));
        assertThrows(OperationNotAllowedException.class, () ->
                campusCheckInService.processGuardDecision(
                        CampusDecisionRequest.builder().qrToken(qr.getQrToken()).approved(true).build(), "outsider"));

        // Rejection without reason rejected
        assertThrows(OperationNotAllowedException.class, () ->
                campusCheckInService.processGuardDecision(
                        CampusDecisionRequest.builder().qrToken(qr.getQrToken()).approved(false).rejectionReason(" ").build(), "guard1"));

        // Rejection with reason stored properly and keeps user off campus
        CampusDecisionResponse rejected = campusCheckInService.processGuardDecision(
                CampusDecisionRequest.builder().qrToken(qr.getQrToken()).approved(false).rejectionReason("Photo mismatch").build(),
                "guard1"
        );
        assertEquals("REJECTED", rejected.getDecision());
        assertFalse(campusCheckInService.hasActiveOpenCampusCheckIn(student));
        assertEquals("Photo mismatch", campusCheckInService.getStatus("student1", CampusPersonRole.STUDENT)
                .getRecentHistory().get(0).getRejectionReason());
    }
}
