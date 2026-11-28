package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Repo.AcademicYearRepository;
import com.Smart.Erp.Modules.Academic.Repo.CourseRepo;
import com.Smart.Erp.Modules.Academic.Repo.SectionRepo;
import com.Smart.Erp.Modules.Attendance.DTO.AttendanceSessionResponse;
import com.Smart.Erp.Modules.Attendance.DTO.AttendanceStatsResponse;
import com.Smart.Erp.Modules.Attendance.DTO.StartAttendanceRequest;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.StudentAttendance;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceEventType;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import com.Smart.Erp.Modules.Attendance.Repo.AttendanceSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.StudentAttendanceRepository;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Subject.Repo.SubjectRepo;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.TimeTable.Enum.OperatingStatus;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionAcademicCalendarRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionCalendarDayRepo;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceSessionService {

    private final AttendanceSessionRepository sessionRepository;
    private final StudentAttendanceRepository studentAttendanceRepository;
    private final StudentEnrollmentRepo studentEnrollmentRepo;
    private final TeacherRepo teacherRepo;
    private final UserRepo userRepo;
    private final AcademicYearRepository academicYearRepository;
    private final CourseRepo courseRepo;
    private final SectionRepo sectionRepo;
    private final SubjectRepo subjectRepo;
    private final QRTokenService qrTokenService;
    private final AttendanceWebSocketPublisher webSocketPublisher;
    private final AttendanceAuditService auditService;
    private final StringRedisTemplate redisTemplate;
    private final SectionAcademicCalendarRepo sectionCalendarRepo;
    private final SectionCalendarDayRepo sectionCalendarDayRepo;
    private final LocalNetworkPolicy localNetworkPolicy;
    private final CryptographicHandshakeService cryptographicHandshakeService;

    public AttendanceSessionResponse startSession(StartAttendanceRequest request, String teacherUsername) {
        User user = userRepo.findByUsername(teacherUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + teacherUsername));
        Teacher teacher = teacherRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Teacher profile not found for user: " + teacherUsername));

        AcademicYear academicYear = academicYearRepository.findById(request.getAcademicYearId())
                .orElseThrow(() -> new RuntimeException("Academic year not found"));
        Course course = courseRepo.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));
        Section section = sectionRepo.findById(request.getSectionId())
                .orElseThrow(() -> new RuntimeException("Section not found"));
        Subject subject = subjectRepo.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        if (section.getCourse() != null && !Objects.equals(section.getCourse().getId(), course.getId())) {
            throw new IllegalArgumentException("Selected section '" + section.getName() + "' does not belong to course '" + course.getName() + "'.");
        }
        if (subject.getCourse() != null && !Objects.equals(subject.getCourse().getId(), course.getId())) {
            throw new IllegalArgumentException("Selected subject '" + subject.getName() + "' does not belong to course '" + course.getName() + "'.");
        }

        // Logically bind attendance with Section Academic Calendar when configured
        LocalDate today = LocalDate.now();
        sectionCalendarRepo.findBySectionId(section.getId()).ifPresent(calendar ->
                sectionCalendarDayRepo.findByCalendarIdAndCalendarDate(calendar.getId(), today).ifPresent(day -> {
                    if (day.getOperatingStatus() == OperatingStatus.CLOSED || !Boolean.TRUE.equals(day.getInstructionDay())) {
                        String reason = day.getHolidayReason() != null && !day.getHolidayReason().isBlank()
                                ? day.getHolidayReason()
                                : (day.getTitle() != null ? day.getTitle() : day.getDayType().name());
                        throw new IllegalStateException(
                                "Cannot start attendance session: Section Academic Calendar marks " + today + " as non-instructional/closed (" + reason + ")."
                        );
                    }
                })
        );

        // Close any prior active session owned by this teacher
        sessionRepository.findFirstByTeacherAndStatus(teacher, AttendanceSessionStatus.ACTIVE)
                .ifPresent(existing -> {
                    existing.setStatus(AttendanceSessionStatus.CLOSED);
                    existing.setEndTime(LocalDateTime.now());
                    sessionRepository.save(existing);
                    redisTemplate.delete("attendance:session:" + existing.getSessionUuid());
                });

        String sessionUuid = UUID.randomUUID().toString();
        String qrSecret = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(90);

        String normalizedLanIp = (request.getLocalServerIp() != null && !request.getLocalServerIp().isBlank())
                ? localNetworkPolicy.normalizeIp(request.getLocalServerIp())
                : "WEBRTC_P2P";
        List<String> normalizedSubnets = localNetworkPolicy.normalizeAndValidateSubnets(
                request.getAllowedSubnets(), normalizedLanIp);
        String allowedSubnetsCsv = String.join(",", normalizedSubnets);

        cryptographicHandshakeService.validateEd25519AndX25519Keys(
                request.getTeacherEd25519PublicKey(),
                request.getTeacherX25519PublicKey(),
                "teacher"
        );
        int companionPort = request.getLocalServerPort() != null && request.getLocalServerPort() > 0
                ? request.getLocalServerPort()
                : 0;

        AttendanceSession session = AttendanceSession.builder()
                .sessionUuid(sessionUuid)
                .teacher(teacher)
                .academicYear(academicYear)
                .course(course)
                .section(section)
                .subject(subject)
                .roomNumber(request.getRoomNumber() != null ? request.getRoomNumber() : "Room 101")
                .status(AttendanceSessionStatus.ACTIVE)
                .qrSecret(qrSecret)
                .localServerIp(normalizedLanIp)
                .localServerPort(companionPort)
                .teacherEd25519PublicKey(request.getTeacherEd25519PublicKey().trim())
                .teacherX25519PublicKey(request.getTeacherX25519PublicKey().trim())
                .allowedSubnets(allowedSubnetsCsv)
                .startTime(now)
                .expiresAt(expiresAt)
                .build();

        session = sessionRepository.save(session);

        // Cache in Redis for fast active-session validation (90 mins TTL)
        redisTemplate.opsForValue().set(
                "attendance:session:" + sessionUuid,
                teacher.getId().toString(),
                Duration.ofMinutes(90)
        );

        String backendPublicKey = cryptographicHandshakeService.getBackendEd25519PublicKeyBase64();

        // Generate signed QR payload (60-second rotating validity) pinned to companion public keys & LAN subnets
        String qrPayload = qrTokenService.generateTeacherQRPayload(
                sessionUuid,
                teacher.getId(),
                session.getLocalServerIp(),
                session.getLocalServerPort(),
                session.getTeacherEd25519PublicKey(),
                session.getTeacherX25519PublicKey(),
                session.getAllowedSubnets(),
                backendPublicKey,
                60
        );

        auditService.logEvent(
                session, null, user, "TEACHER",
                "ATTENDANCE_SESSION_STARTED", "NONE", "ACTIVE",
                "Started session for subject " + subject.getName() + " in section " + section.getName(),
                session.getLocalServerIp()
        );

        webSocketPublisher.publishEvent(
                AttendanceEventType.ATTENDANCE_SESSION_STARTED,
                sessionUuid, null, null, null, "ACTIVE",
                "Attendance session started for " + subject.getName()
        );

        long eligibleCount = countEligibleStudents(section);

        return mapToSessionResponse(session, qrPayload, 0, eligibleCount);
    }

    public AttendanceSessionResponse stopSession(String sessionUuid, String teacherUsername) {
        AttendanceSession session = sessionRepository.findBySessionUuid(sessionUuid)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionUuid));

        if (!session.getTeacher().getUser().getUsername().equals(teacherUsername)) {
            throw new RuntimeException("Unauthorized: You do not own this attendance session");
        }

        session.setStatus(AttendanceSessionStatus.CLOSED);
        session.setEndTime(LocalDateTime.now());
        sessionRepository.save(session);

        redisTemplate.delete("attendance:session:" + sessionUuid);

        auditService.logEvent(
                session, null, session.getTeacher().getUser(), "TEACHER",
                "ATTENDANCE_SESSION_CLOSED", "ACTIVE", "CLOSED",
                "Closed attendance session " + sessionUuid,
                session.getLocalServerIp()
        );

        webSocketPublisher.publishEvent(
                AttendanceEventType.ATTENDANCE_SESSION_CLOSED,
                sessionUuid, null, null, null, "CLOSED",
                "Attendance session closed"
        );

        long presentCount = studentAttendanceRepository.countByAttendanceSession(session);
        long eligibleCount = countEligibleStudents(session.getSection());

        return mapToSessionResponse(session, null, presentCount, eligibleCount);
    }

    public String refreshQr(String sessionUuid, String teacherUsername) {
        AttendanceSession session = sessionRepository.findBySessionUuid(sessionUuid)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionUuid));

        if (session.getStatus() != AttendanceSessionStatus.ACTIVE) {
            throw new RuntimeException("Session is not active");
        }

        if (!session.getTeacher().getUser().getUsername().equals(teacherUsername)) {
            throw new RuntimeException("Unauthorized: You do not own this attendance session");
        }

        String qrPayload = qrTokenService.generateTeacherQRPayload(
                sessionUuid,
                session.getTeacher().getId(),
                session.getLocalServerIp(),
                session.getLocalServerPort(),
                session.getTeacherEd25519PublicKey(),
                session.getTeacherX25519PublicKey(),
                session.getAllowedSubnets(),
                cryptographicHandshakeService.getBackendEd25519PublicKeyBase64(),
                60
        );

        webSocketPublisher.publishEvent(
                AttendanceEventType.QR_GENERATED,
                sessionUuid, null, null, null, "ACTIVE",
                "Fresh attendance QR payload generated"
        );

        return qrPayload;
    }

    public AttendanceSessionResponse getActiveSession(String teacherUsername) {
        User user = userRepo.findByUsername(teacherUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + teacherUsername));
        Teacher teacher = teacherRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        return sessionRepository.findFirstByTeacherAndStatus(teacher, AttendanceSessionStatus.ACTIVE)
                .map(session -> {
                    String qr = qrTokenService.generateTeacherQRPayload(
                            session.getSessionUuid(),
                            teacher.getId(),
                            session.getLocalServerIp(),
                            session.getLocalServerPort(),
                            session.getTeacherEd25519PublicKey(),
                            session.getTeacherX25519PublicKey(),
                            session.getAllowedSubnets(),
                            cryptographicHandshakeService.getBackendEd25519PublicKeyBase64(),
                            60
                    );
                    long presentCount = studentAttendanceRepository.countByAttendanceSession(session);
                    long eligibleCount = countEligibleStudents(session.getSection());
                    return mapToSessionResponse(session, qr, presentCount, eligibleCount);
                })
                .orElse(null);
    }

    public Map<String, Object> getAttendanceFilters(String teacherUsername) {
        Long uniId = teacherUsername != null
                ? userRepo.findByUsername(teacherUsername)
                        .map(u -> u.getUniversity() != null ? u.getUniversity().getId() : null)
                        .orElse(null)
                : null;

        var years = academicYearRepository.findAll().stream()
                .filter(y -> uniId == null || (y.getUniversity() != null && Objects.equals(y.getUniversity().getId(), uniId)))
                .map(y -> Map.of("id", (Object) y.getId(), "name", (Object) y.getName()))
                .toList();
        var courses = courseRepo.findAll().stream()
                .filter(c -> uniId == null || (c.getDepartment() != null && c.getDepartment().getSchool() != null
                        && c.getDepartment().getSchool().getUniversity() != null
                        && Objects.equals(c.getDepartment().getSchool().getUniversity().getId(), uniId)))
                .map(c -> Map.of("id", (Object) c.getId(), "name", (Object) c.getName()))
                .toList();
        var sections = sectionRepo.findAll().stream()
                .filter(s -> uniId == null || (s.getCourse() != null && s.getCourse().getDepartment() != null
                        && s.getCourse().getDepartment().getSchool() != null
                        && s.getCourse().getDepartment().getSchool().getUniversity() != null
                        && Objects.equals(s.getCourse().getDepartment().getSchool().getUniversity().getId(), uniId)))
                .map(s -> Map.of("id", (Object) s.getId(), "name", (Object) s.getName()))
                .toList();
        var subjects = subjectRepo.findAll().stream()
                .filter(sb -> uniId == null || (sb.getCourse() != null && sb.getCourse().getDepartment() != null
                        && sb.getCourse().getDepartment().getSchool() != null
                        && sb.getCourse().getDepartment().getSchool().getUniversity() != null
                        && Objects.equals(sb.getCourse().getDepartment().getSchool().getUniversity().getId(), uniId)))
                .map(sb -> Map.of("id", (Object) sb.getId(), "name", (Object) sb.getName()))
                .toList();

        return Map.of(
                "academicYears", years,
                "courses", courses,
                "sections", sections,
                "subjects", subjects
        );
    }

    public AttendanceStatsResponse getSessionStats(String sessionUuid) {
        AttendanceSession session = sessionRepository.findBySessionUuid(sessionUuid)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionUuid));

        List<StudentAttendance> attendances = studentAttendanceRepository.findAllByAttendanceSession(session);
        long eligibleCount = countEligibleStudents(session.getSection());

        List<AttendanceStatsResponse.StudentAttendanceItemDto> studentItems = attendances.stream()
                .map(att -> {
                    Student s = att.getStudent();
                    String studentName = s.getUser() != null && s.getUser().getBasicDetail() != null
                            ? s.getUser().getBasicDetail().getFirstName() + " " + s.getUser().getBasicDetail().getLastName()
                            : "Student #" + s.getId();
                    String roll = s.getEnrollments() != null && !s.getEnrollments().isEmpty()
                            ? s.getEnrollments().get(0).getRollNumber()
                            : s.getRegistrationNumber();

                    return AttendanceStatsResponse.StudentAttendanceItemDto.builder()
                            .studentId(s.getId())
                            .studentName(studentName)
                            .rollNumber(roll)
                            .status(att.getStatus().name())
                            .checkInTime(att.getCheckInTime())
                            .similarityScore(att.getSimilarityScore())
                            .guardApproved(att.getGuardCheckInStatus() == com.Smart.Erp.Modules.Attendance.Enum.GuardCheckInState.APPROVED)
                            .guardName(att.getGuard() != null && att.getGuard().getUser() != null && att.getGuard().getUser().getBasicDetail() != null
                                    ? att.getGuard().getUser().getBasicDetail().getFirstName() + " " + att.getGuard().getUser().getBasicDetail().getLastName()
                                    : (att.getGuard() != null ? "Guard #" + att.getGuard().getId() : "N/A"))
                            .remarks(att.getRemarks())
                            .build();
                })
                .collect(Collectors.toList());

        long presentCount = attendances.stream()
                .filter(a -> a.getStatus() == com.Smart.Erp.Modules.Teacher.Enum.AttendanceStatus.PRESENT)
                .count();

        long lateCount = attendances.stream()
                .filter(a -> a.getStatus() == com.Smart.Erp.Modules.Teacher.Enum.AttendanceStatus.LATE)
                .count();

        return AttendanceStatsResponse.builder()
                .sessionUuid(sessionUuid)
                .totalEligible(eligibleCount)
                .totalPresent(presentCount)
                .totalLate(lateCount)
                .totalRejected(0)
                .students(studentItems)
                .build();
    }

    private long countEligibleStudents(Section section) {
        if (section == null || section.getSectionGroups() == null) {
            return 0;
        }
        return section.getSectionGroups().stream()
                .mapToLong(sg -> studentEnrollmentRepo.countBySectionGroup(sg))
                .sum();
    }

    private AttendanceSessionResponse mapToSessionResponse(
            AttendanceSession session,
            String qrPayload,
            long presentCount,
            long eligibleCount
    ) {
        String teacherName = session.getTeacher().getUser() != null && session.getTeacher().getUser().getBasicDetail() != null
                ? session.getTeacher().getUser().getBasicDetail().getFirstName() + " " + session.getTeacher().getUser().getBasicDetail().getLastName()
                : "Faculty #" + session.getTeacher().getId();

        return AttendanceSessionResponse.builder()
                .id(session.getId())
                .sessionUuid(session.getSessionUuid())
                .teacherName(teacherName)
                .academicYearName(session.getAcademicYear() != null ? session.getAcademicYear().getName() : "N/A")
                .courseName(session.getCourse() != null ? session.getCourse().getName() : "N/A")
                .sectionName(session.getSection() != null ? session.getSection().getName() : "N/A")
                .subjectName(session.getSubject() != null ? session.getSubject().getName() : "N/A")
                .roomNumber(session.getRoomNumber())
                .status(session.getStatus())
                .localServerIp(session.getLocalServerIp())
                .localServerPort(session.getLocalServerPort())
                .teacherEd25519PublicKey(session.getTeacherEd25519PublicKey())
                .teacherX25519PublicKey(session.getTeacherX25519PublicKey())
                .allowedSubnets(session.getAllowedSubnets())
                .backendPublicKey(cryptographicHandshakeService.getBackendEd25519PublicKeyBase64())
                .qrPayload(qrPayload)
                .startTime(session.getStartTime())
                .expiresAt(session.getExpiresAt())
                .totalPresent(presentCount)
                .totalEligible(eligibleCount)
                .build();
    }
}
