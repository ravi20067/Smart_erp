package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Attendance.DTO.*;
import com.Smart.Erp.Modules.Attendance.Entity.CampusCheckInRecord;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceEventType;
import com.Smart.Erp.Modules.Attendance.Enum.CampusCheckDirection;
import com.Smart.Erp.Modules.Attendance.Enum.CampusPersonRole;
import com.Smart.Erp.Modules.Attendance.Enum.GuardCheckInState;
import com.Smart.Erp.Modules.Attendance.Repo.CampusCheckInRepository;
import com.Smart.Erp.Modules.SecurityGuard.Entity.SecurityGuard;
import com.Smart.Erp.Modules.SecurityGuard.Repo.SecurityGuardRepo;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CampusCheckInService {

    private static final int QR_TTL_SECONDS = 300;

    private final CampusCheckInRepository campusRepo;
    private final UserRepo userRepo;
    private final StudentRepo studentRepo;
    private final StudentEnrollmentRepo studentEnrollmentRepo;
    private final TeacherRepo teacherRepo;
    private final SecurityGuardRepo securityGuardRepo;
    private final AttendanceAuditService auditService;
    private final AttendanceWebSocketPublisher webSocketPublisher;
    private final StringRedisTemplate redisTemplate;

    public CampusStatusResponse getStatus(String username, CampusPersonRole expectedRole) {
        User user = resolveUser(username);
        PersonIdentity identity = resolveIdentity(user, expectedRole);
        Optional<CampusCheckInRecord> openCheckIn = getOpenApprovedCheckIn(user);
        List<CampusHistoryItemDto> history = campusRepo.findAllByUserOrderByRequestedAtDesc(user).stream()
                .map(this::toHistoryItem)
                .toList();

        return CampusStatusResponse.builder()
                .personRole(expectedRole)
                .campusStatus(openCheckIn.isPresent() ? "ON_CAMPUS" : "OFF_CAMPUS")
                .hasActiveOpenCheckIn(openCheckIn.isPresent())
                .openCheckInId(openCheckIn.map(CampusCheckInRecord::getId).orElse(null))
                .openCheckInTime(openCheckIn.map(CampusCheckInRecord::getActionTime).orElse(null))
                .fullName(identity.fullName)
                .primaryIdentifier(identity.primaryIdentifier)
                .recentHistory(history)
                .build();
    }

    public CampusQrResponse generateQr(String username, CampusPersonRole expectedRole, CampusCheckDirection direction) {
        if (direction == null) {
            throw new IllegalArgumentException("Campus check direction (CHECK_IN or CHECK_OUT) is required");
        }
        User user = resolveUser(username);
        PersonIdentity identity = resolveIdentity(user, expectedRole);

        Optional<CampusCheckInRecord> openCheckIn = getOpenApprovedCheckIn(user);

        if (direction == CampusCheckDirection.CHECK_IN) {
            if (openCheckIn.isPresent()) {
                throw new OperationNotAllowedException(
                        "Duplicate entry prevented: You already have an open approved Campus Check-In from "
                                + openCheckIn.get().getActionTime() + ". Please Check Out first."
                );
            }
        } else {
            CampusCheckInRecord activeEntry = openCheckIn.orElseThrow(() ->
                    new OperationNotAllowedException(
                            "Campus Check-Out requires an existing approved open Campus Check-In."
                    )
            );
            if (campusRepo.existsByLinkedCheckInAndStatus(activeEntry, GuardCheckInState.APPROVED)) {
                throw new OperationNotAllowedException(
                        "Duplicate exit prevented: An approved Check-Out already exists for your current Campus Check-In."
                );
            }
        }

        // Expire any stale pending requests of the same direction to avoid orphan duplicate QRs
        List<CampusCheckInRecord> priorPending = campusRepo.findAllByUserAndDirectionAndStatus(
                user, direction, GuardCheckInState.PENDING
        );
        for (CampusCheckInRecord stale : priorPending) {
            stale.setStatus(GuardCheckInState.EXPIRED);
            campusRepo.save(stale);
            invalidateRedisToken(stale.getQrToken());
        }

        String token = "CMP-" + UUID.randomUUID().toString().replace("-", "");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(QR_TTL_SECONDS);

        CampusCheckInRecord record = CampusCheckInRecord.builder()
                .qrToken(token)
                .user(user)
                .personRole(expectedRole)
                .student(identity.student)
                .teacher(identity.teacher)
                .direction(direction)
                .status(GuardCheckInState.PENDING)
                .linkedCheckIn(direction == CampusCheckDirection.CHECK_OUT ? openCheckIn.orElse(null) : null)
                .checkedOut(false)
                .requestedAt(now)
                .expiresAt(expiresAt)
                .build();

        campusRepo.save(record);
        cacheRedisToken(token, user.getId(), direction);

        AttendanceEventType pendingEvent = direction == CampusCheckDirection.CHECK_IN
                ? AttendanceEventType.CAMPUS_CHECKIN_PENDING
                : AttendanceEventType.CAMPUS_CHECKOUT_PENDING;

        auditService.logEvent(
                null, identity.student, user, expectedRole.name(),
                pendingEvent.name(), "NONE", "PENDING",
                expectedRole.name() + " requested Campus " + direction.name() + " QR token",
                null
        );

        webSocketPublisher.publishCampusEvent(
                pendingEvent,
                user.getId(),
                identity.student != null ? identity.student.getId() : (identity.teacher != null ? identity.teacher.getId() : user.getId()),
                identity.fullName,
                identity.primaryIdentifier,
                "PENDING",
                identity.fullName + " (" + expectedRole.name() + ") requested gate " + direction.name()
        );

        return CampusQrResponse.builder()
                .qrToken(token)
                .qrData("CAMPUS:" + token)
                .direction(direction)
                .personRole(expectedRole)
                .displayName(identity.fullName)
                .identifierLabel(expectedRole == CampusPersonRole.STUDENT ? "Enrollment / Roll" : "Employee ID")
                .identifierValue(identity.primaryIdentifier)
                .expiresAt(expiresAt)
                .currentCampusStatus(openCheckIn.isPresent() ? "ON_CAMPUS" : "OFF_CAMPUS")
                .openCheckInId(openCheckIn.map(CampusCheckInRecord::getId).orElse(null))
                .openCheckInTime(openCheckIn.map(CampusCheckInRecord::getActionTime).orElse(null))
                .build();
    }

    public CampusGuardScanResponse scanCampusQr(String rawQrToken, String guardUsername) {
        GuardActor guardActor = resolveAuthorizedGuard(guardUsername);
        String token = cleanToken(rawQrToken);
        if (token.isEmpty()) {
            throw new IllegalArgumentException("Campus QR token cannot be empty");
        }

        CampusCheckInRecord record = campusRepo.findByQrToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unrecognized Campus Check-In QR token"));

        if (record.getStatus() == GuardCheckInState.PENDING && LocalDateTime.now().isAfter(record.getExpiresAt())) {
            record.setStatus(GuardCheckInState.EXPIRED);
            campusRepo.save(record);
            invalidateRedisToken(token);
            throw new OperationNotAllowedException("Campus Check-In QR token has expired");
        }

        User subjectUser = record.getUser();
        PersonIdentity identity = resolveIdentity(subjectUser, record.getPersonRole());
        Optional<CampusCheckInRecord> openCheckIn = getOpenApprovedCheckIn(subjectUser);

        boolean hasPhoto = subjectUser.getBasicDetail() != null && subjectUser.getBasicDetail().getPhoto() != null;
        String photoUrl = hasPhoto ? "/security-guard/campus-check-in/photo/" + subjectUser.getId() : null;

        return CampusGuardScanResponse.builder()
                .qrToken(token)
                .personRole(record.getPersonRole())
                .direction(record.getDirection())
                .status(record.getStatus().name())
                .alreadyDecided(record.getStatus() != GuardCheckInState.PENDING)
                .userId(subjectUser.getId())
                .studentId(record.getStudent() != null ? record.getStudent().getId() : null)
                .teacherId(record.getTeacher() != null ? record.getTeacher().getId() : null)
                .fullName(identity.fullName)
                .photoUrl(photoUrl)
                .hasRegisteredPhoto(hasPhoto)
                .enrollmentNumber(identity.enrollmentNumber)
                .courseName(identity.courseName)
                .sectionName(identity.sectionName)
                .academicYearName(identity.academicYearName)
                .employeeId(identity.employeeId)
                .departmentName(identity.departmentName)
                .designation(identity.designation)
                .openCheckInTime(openCheckIn.map(CampusCheckInRecord::getActionTime).orElse(null))
                .requestedAt(record.getRequestedAt())
                .expiresAt(record.getExpiresAt())
                .build();
    }

    public CampusDecisionResponse processGuardDecision(CampusDecisionRequest request, String guardUsername) {
        if (request == null) {
            throw new IllegalArgumentException("Campus decision request is required");
        }
        GuardActor guardActor = resolveAuthorizedGuard(guardUsername);
        String token = cleanToken(request.getQrToken());
        if (token.isEmpty()) {
            throw new IllegalArgumentException("Campus QR token is required");
        }

        String tokenLockKey = "lock:campus_decision:" + token;
        Boolean tokenLocked = redisTemplate.opsForValue().setIfAbsent(tokenLockKey, "1", Duration.ofSeconds(10));
        if (Boolean.FALSE.equals(tokenLocked)) {
            throw new OperationNotAllowedException("Concurrent decision detected for this campus QR token.");
        }

        try {
            CampusCheckInRecord record = campusRepo.findByQrToken(token)
                    .orElseThrow(() -> new ResourceNotFoundException("Campus Check-In QR token not found"));

            if (record.getStatus() != GuardCheckInState.PENDING) {
                throw new OperationNotAllowedException(
                        "This Campus QR request has already been finalized with status: " + record.getStatus().name()
                );
            }
            if (LocalDateTime.now().isAfter(record.getExpiresAt())) {
                record.setStatus(GuardCheckInState.EXPIRED);
                campusRepo.save(record);
                invalidateRedisToken(token);
                throw new OperationNotAllowedException("Campus QR token has expired and cannot be approved.");
            }

            User subjectUser = record.getUser();
            String userLockKey = "lock:campus_cycle:" + subjectUser.getId();
            Boolean userLocked = redisTemplate.opsForValue().setIfAbsent(userLockKey, "1", Duration.ofSeconds(10));
            if (Boolean.FALSE.equals(userLocked)) {
                throw new OperationNotAllowedException("Another gate decision is currently in progress for this user.");
            }

            try {
                PersonIdentity identity = resolveIdentity(subjectUser, record.getPersonRole());
                LocalDateTime now = LocalDateTime.now();

                if (!request.isApproved()) {
                    String reason = request.getRejectionReason() != null ? request.getRejectionReason().trim() : "";
                    if (reason.isEmpty()) {
                        throw new OperationNotAllowedException(
                                "A mandatory rejection reason is required when rejecting campus entry/exit."
                        );
                    }

                    record.setStatus(GuardCheckInState.REJECTED);
                    record.setRejectionReason(reason);
                    record.setGuard(guardActor.guard);
                    record.setDecisionByUser(guardActor.user);
                    record.setActionTime(now);
                    record.setDeviceDetails(request.getDeviceDetails());
                    campusRepo.save(record);
                    invalidateRedisToken(token);

                    AttendanceEventType eventType = record.getDirection() == CampusCheckDirection.CHECK_IN
                            ? AttendanceEventType.CAMPUS_CHECKIN_REJECTED
                            : AttendanceEventType.CAMPUS_CHECKOUT_REJECTED;

                    auditService.logEvent(
                            null, record.getStudent(), guardActor.user, "SECURITY_GUARD",
                            eventType.name(), "PENDING", "REJECTED",
                            record.getPersonRole() + " Campus " + record.getDirection() + " rejected: " + reason,
                            request.getDeviceDetails()
                    );

                    webSocketPublisher.publishCampusEvent(
                            eventType,
                            subjectUser.getId(),
                            record.getStudent() != null ? record.getStudent().getId() : (record.getTeacher() != null ? record.getTeacher().getId() : subjectUser.getId()),
                            identity.fullName,
                            identity.primaryIdentifier,
                            "REJECTED",
                            "Campus " + record.getDirection().name() + " rejected: " + reason
                    );

                    return CampusDecisionResponse.builder()
                            .qrToken(token)
                            .personRole(record.getPersonRole())
                            .direction(record.getDirection())
                            .decision("REJECTED")
                            .fullName(identity.fullName)
                            .actionTime(now)
                            .message(record.getPersonRole().name() + " " + record.getDirection().name() + " rejected.")
                            .build();
                }

                // Approval rules enforcement
                if (record.getDirection() == CampusCheckDirection.CHECK_IN) {
                    if (campusRepo.existsByUserAndDirectionAndStatusAndCheckedOutFalse(
                            subjectUser, CampusCheckDirection.CHECK_IN, GuardCheckInState.APPROVED
                    )) {
                        throw new OperationNotAllowedException(
                                "Duplicate entry prevented: User already has an active open Campus Check-In."
                        );
                    }
                    record.setCheckedOut(false);
                } else {
                    CampusCheckInRecord entry = record.getLinkedCheckIn();
                    if (entry == null) {
                        entry = getOpenApprovedCheckIn(subjectUser).orElse(null);
                    }
                    if (entry == null || entry.getStatus() != GuardCheckInState.APPROVED || Boolean.TRUE.equals(entry.getCheckedOut())) {
                        throw new OperationNotAllowedException(
                                "Cannot approve Check-Out: No active open Campus Check-In exists."
                        );
                    }
                    if (campusRepo.existsByLinkedCheckInAndStatus(entry, GuardCheckInState.APPROVED)) {
                        throw new OperationNotAllowedException(
                                "Duplicate exit prevented: An approved Check-Out already exists for this entry."
                        );
                    }
                    entry.setCheckedOut(true);
                    campusRepo.save(entry);
                    record.setLinkedCheckIn(entry);
                }

                record.setStatus(GuardCheckInState.APPROVED);
                record.setGuard(guardActor.guard);
                record.setDecisionByUser(guardActor.user);
                record.setActionTime(now);
                record.setDeviceDetails(request.getDeviceDetails());
                campusRepo.save(record);
                invalidateRedisToken(token);

                AttendanceEventType approvedEvent = record.getDirection() == CampusCheckDirection.CHECK_IN
                        ? AttendanceEventType.CAMPUS_CHECKIN_APPROVED
                        : AttendanceEventType.CAMPUS_CHECKOUT_APPROVED;

                auditService.logEvent(
                        null, record.getStudent(), guardActor.user, "SECURITY_GUARD",
                        approvedEvent.name(), "PENDING", "APPROVED",
                        record.getPersonRole() + " Campus " + record.getDirection() + " approved by guard " + guardUsername,
                        request.getDeviceDetails()
                );

                webSocketPublisher.publishCampusEvent(
                        approvedEvent,
                        subjectUser.getId(),
                        record.getStudent() != null ? record.getStudent().getId() : (record.getTeacher() != null ? record.getTeacher().getId() : subjectUser.getId()),
                        identity.fullName,
                        identity.primaryIdentifier,
                        "APPROVED",
                        record.getPersonRole().name() + " Campus " + record.getDirection().name() + " approved for " + identity.fullName
                );

                return CampusDecisionResponse.builder()
                        .qrToken(token)
                        .personRole(record.getPersonRole())
                        .direction(record.getDirection())
                        .decision("APPROVED")
                        .fullName(identity.fullName)
                        .actionTime(now)
                        .message(record.getPersonRole().name() + " " + record.getDirection().name() + " approved and recorded.")
                        .build();
            } finally {
                redisTemplate.delete(userLockKey);
            }
        } finally {
            redisTemplate.delete(tokenLockKey);
        }
    }

    public List<CampusHistoryItemDto> getRecentCampusLogsForGuard(String guardUsername) {
        resolveAuthorizedGuard(guardUsername);
        return campusRepo.findTop100ByOrderByRequestedAtDesc().stream()
                .map(this::toHistoryItem)
                .toList();
    }

    public boolean hasActiveOpenCampusCheckIn(Student student) {
        if (student == null || student.getUser() == null) {
            return false;
        }
        return campusRepo.existsByStudentAndDirectionAndStatusAndCheckedOutFalse(
                student, CampusCheckDirection.CHECK_IN, GuardCheckInState.APPROVED
        ) || campusRepo.existsByUserAndDirectionAndStatusAndCheckedOutFalse(
                student.getUser(), CampusCheckDirection.CHECK_IN, GuardCheckInState.APPROVED
        );
    }

    public void requireOpenCampusCheckIn(Student student) {
        if (!hasActiveOpenCampusCheckIn(student)) {
            throw new OperationNotAllowedException(
                    "Classroom attendance blocked: Student must have an approved, open Campus Check-In and must not have checked out."
            );
        }
    }

    private Optional<CampusCheckInRecord> getOpenApprovedCheckIn(User user) {
        return campusRepo.findFirstByUserAndDirectionAndStatusAndCheckedOutFalseOrderByActionTimeDesc(
                user, CampusCheckDirection.CHECK_IN, GuardCheckInState.APPROVED
        );
    }

    private void cacheRedisToken(String token, Long userId, CampusCheckDirection direction) {
        redisTemplate.opsForValue().set(
                "campus:checkin_token:" + token,
                userId + ":" + direction.name(),
                Duration.ofSeconds(QR_TTL_SECONDS)
        );
    }

    private void invalidateRedisToken(String token) {
        if (token != null && !token.isBlank()) {
            redisTemplate.delete("campus:checkin_token:" + token);
        }
    }

    private String cleanToken(String raw) {
        return raw == null ? "" : raw.replace("CAMPUS:", "").trim();
    }

    private User resolveUser(String username) {
        return userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found: " + username));
    }

    private GuardActor resolveAuthorizedGuard(String guardUsername) {
        User guardUser = resolveUser(guardUsername);
        Optional<SecurityGuard> guardOpt = securityGuardRepo.findByUser(guardUser);
        boolean hasGuardRole = guardOpt.isPresent()
                || guardUser.getUserRole() == UserRoles.SECURITY_GUARD
                || guardUser.getUserRole() == UserRoles.ADMIN
                || guardUser.getUserRole() == UserRoles.SUPER_ADMIN;

        if (!hasGuardRole) {
            throw new OperationNotAllowedException(
                    "Unauthorized: User " + guardUsername + " is not authorized to verify or approve campus gate check-ins."
            );
        }
        return new GuardActor(guardUser, guardOpt.orElse(null));
    }

    private PersonIdentity resolveIdentity(User user, CampusPersonRole role) {
        BasicDetail detail = user.getBasicDetail();
        String fullName = detail != null
                ? ((detail.getFirstName() != null ? detail.getFirstName() : "") + " "
                + (detail.getLastName() != null ? detail.getLastName() : "")).trim()
                : user.getUsername();
        if (fullName.isEmpty()) {
            fullName = user.getUsername();
        }

        if (role == CampusPersonRole.STUDENT) {
            Student student = studentRepo.findByUser(user)
                    .orElseThrow(() -> new OperationNotAllowedException(
                            "Unauthorized: User " + user.getUsername() + " does not have a Student profile."
                    ));
            StudentEnrollment latestEnrollment = studentEnrollmentRepo.findAllByStudent(student).stream()
                    .filter(e -> e.getStatus() == EnrollmentStatus.ACTIVE)
                    .findFirst()
                    .orElseGet(() -> studentEnrollmentRepo.findAllByStudent(student).stream().findFirst().orElse(null));

            String enrollmentNum = latestEnrollment != null && latestEnrollment.getRollNumber() != null
                    ? latestEnrollment.getRollNumber()
                    : student.getRegistrationNumber();
            String regNum = student.getRegistrationNumber();
            String combinedId = (regNum != null && !regNum.isBlank()) ? regNum : enrollmentNum;
            String courseName = latestEnrollment != null && latestEnrollment.getSectionGroup() != null
                    && latestEnrollment.getSectionGroup().getSpecialization() != null
                    && latestEnrollment.getSectionGroup().getSpecialization().getCourse() != null
                    ? latestEnrollment.getSectionGroup().getSpecialization().getCourse().getName()
                    : "N/A";
            String sectionName = latestEnrollment != null && latestEnrollment.getSectionGroup() != null
                    && latestEnrollment.getSectionGroup().getSection() != null
                    ? latestEnrollment.getSectionGroup().getSection().getName()
                    : "N/A";
            String academicYearName = latestEnrollment != null && latestEnrollment.getSectionGroup() != null
                    && latestEnrollment.getSectionGroup().getSection() != null
                    && latestEnrollment.getSectionGroup().getSection().getAcademicYear() != null
                    ? latestEnrollment.getSectionGroup().getSection().getAcademicYear().getName()
                    : "N/A";

            return new PersonIdentity(
                    fullName, combinedId, student, null,
                    regNum != null ? regNum : enrollmentNum,
                    courseName, sectionName, academicYearName,
                    null, null, null
            );
        }

        Teacher teacher = teacherRepo.findByUser(user)
                .orElseThrow(() -> new OperationNotAllowedException(
                        "Unauthorized: User " + user.getUsername() + " does not have a Teacher profile."
                ));

        String employeeId = user.getUsername() != null && !user.getUsername().isBlank()
                ? user.getUsername()
                : "TCH-" + teacher.getId();

        String departmentName = teacher.getEnrollments().stream()
                .filter(Objects::nonNull)
                .filter(e -> e.getStatus() == EnrollmentStatus.ACTIVE)
                .flatMap(e -> e.getSubjects().stream())
                .map(s -> s.getCourse() != null ? s.getCourse().getDepartment() : null)
                .filter(Objects::nonNull)
                .map(d -> d.getName())
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.joining(", "));
        if (departmentName.isBlank()) {
            departmentName = "Academic Faculty";
        }

        String designation = user.getRoles().stream()
                .filter(Objects::nonNull)
                .map(ur -> ur.getRole() != null ? ur.getRole().getName() : null)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.joining(", "));
        if (designation.isBlank()) {
            designation = user.getUserRole() != null ? user.getUserRole().getDescription() : "Teacher / Faculty";
        }

        return new PersonIdentity(
                fullName, employeeId, null, teacher,
                null, null, null, null,
                employeeId, departmentName, designation
        );
    }

    private CampusHistoryItemDto toHistoryItem(CampusCheckInRecord record) {
        User subjectUser = record.getUser();
        String fullName = subjectUser != null && subjectUser.getBasicDetail() != null
                ? ((subjectUser.getBasicDetail().getFirstName() != null ? subjectUser.getBasicDetail().getFirstName() : "") + " "
                + (subjectUser.getBasicDetail().getLastName() != null ? subjectUser.getBasicDetail().getLastName() : "")).trim()
                : (subjectUser != null ? subjectUser.getUsername() : "User");

        String identifier = record.getPersonRole() == CampusPersonRole.STUDENT
                ? (record.getStudent() != null ? record.getStudent().getRegistrationNumber() : "Student")
                : (subjectUser != null ? subjectUser.getUsername() : "Teacher");

        String guardName = null;
        if (record.getGuard() != null && record.getGuard().getUser() != null && record.getGuard().getUser().getBasicDetail() != null) {
            guardName = record.getGuard().getUser().getBasicDetail().getFirstName() + " "
                    + record.getGuard().getUser().getBasicDetail().getLastName();
        } else if (record.getDecisionByUser() != null) {
            guardName = record.getDecisionByUser().getUsername();
        }

        return CampusHistoryItemDto.builder()
                .id(record.getId())
                .personRole(record.getPersonRole())
                .direction(record.getDirection())
                .status(record.getStatus().name())
                .fullName(fullName)
                .identifier(identifier)
                .guardName(guardName)
                .rejectionReason(record.getRejectionReason())
                .requestedAt(record.getRequestedAt())
                .actionTime(record.getActionTime())
                .checkedOut(Boolean.TRUE.equals(record.getCheckedOut()))
                .linkedCheckInId(record.getLinkedCheckIn() != null ? record.getLinkedCheckIn().getId() : null)
                .build();
    }

    private record GuardActor(User user, SecurityGuard guard) {}

    private record PersonIdentity(
            String fullName,
            String primaryIdentifier,
            Student student,
            Teacher teacher,
            String enrollmentNumber,
            String courseName,
            String sectionName,
            String academicYearName,
            String employeeId,
            String departmentName,
            String designation
    ) {}
}
