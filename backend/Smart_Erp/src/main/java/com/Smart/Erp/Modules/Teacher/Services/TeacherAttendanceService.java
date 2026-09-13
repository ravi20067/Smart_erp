package com.Smart.Erp.Modules.Teacher.Services;

import com.Smart.Erp.Modules.Teacher.DTO.MyAttendence.*;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherAttendance;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.Teacher.Enum.ActivityType;
import com.Smart.Erp.Modules.Teacher.Enum.AttendanceStatus;
import com.Smart.Erp.Modules.Teacher.Enum.AttendanceStatusType;
import com.Smart.Erp.Core.Redis.AttendanceQR;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherAttendanceRepository;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import com.Smart.Erp.Modules.Academic.Services.AcademicMappingService;
import com.Smart.Erp.Modules.User.Services.UserMappingService;
import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TeacherAttendanceService {
    private final TeacherRepo teacherRepository;

    private final UserRepo userRepository;

    private final StringRedisTemplate stringRedisTemplate;

    private final TeacherAttendanceRepository teacherAttendanceRepository;

    private final ObjectMapper objectMapper;

    private final AttendancePublisher attendancePublisher;

    private final AcademicMappingService mappingService;

    private final UserMappingService userMappingService;


    private Teacher getLoggedInTeacher() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Unauthenticated user");
        }
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return teacherRepository.findByUser(user)
                .orElseThrow(() ->
                        new RuntimeException("Teacher not found"));
    }

    private String generateToken() {

        return UUID.randomUUID().toString();

    }

    private String buildTeacherKey(Long teacherId) {

        return "attendance:teacher:" + teacherId;

    }

    private String buildQrKey(String token) {

        return "attendance:qr:" + token;

    }

    private void saveQrInRedis(
            AttendanceQR attendanceQR
    ) throws JsonProcessingException {

        String json =
                objectMapper.writeValueAsString(attendanceQR);

        stringRedisTemplate.opsForValue().set(

                buildQrKey(attendanceQR.getToken()),

                json,

                Duration.ofSeconds(60)

        );

        stringRedisTemplate.opsForValue().set(

                buildTeacherKey(attendanceQR.getTeacherId()),

                attendanceQR.getToken(),

                Duration.ofSeconds(60)

        );

    }

    private void removeOldQr(Long teacherId) {

        String teacherKey =
                buildTeacherKey(teacherId);

        String oldToken =
                stringRedisTemplate.opsForValue().get(teacherKey);

        if (oldToken == null) {
            return;
        }

        stringRedisTemplate.delete(
                buildQrKey(oldToken)
        );

        stringRedisTemplate.delete(
                teacherKey
        );

    }

    private AttendanceQR getAttendanceQR(String token) {

        try {

            String json = stringRedisTemplate.opsForValue()
                    .get(buildQrKey(token));

            if (json == null) {
                throw new RuntimeException("QR Code expired or invalid.");
            }

            return objectMapper.readValue(
                    json,
                    AttendanceQR.class
            );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Unable to verify QR Code.",
                    e
            );

        }

    }

    private void deleteQr(AttendanceQR attendanceQR) {

        stringRedisTemplate.delete(
                buildQrKey(attendanceQR.getToken())
        );

        stringRedisTemplate.delete(
                buildTeacherKey(attendanceQR.getTeacherId())
        );

    }

    private Teacher getTeacher(Long teacherId) {

        return teacherRepository.findById(teacherId)
                .orElseThrow(() ->
                        new RuntimeException("Teacher not found."));

    }

    private TeacherAttendance getTodayAttendance(
            Teacher teacher
    ) {

        return teacherAttendanceRepository
                .findByTeacherAndAttendanceDate(
                        teacher,
                        LocalDate.now()
                )
                .orElse(null);

    }

    private Duration calculateWorkingHours(
            LocalTime checkIn,
            LocalTime checkOut
    ) {

        return Duration.between(
                checkIn,
                checkOut
        );

    }

    private void markCheckIn(
            Teacher teacher,
            String scannerLocation
    ) {

        TeacherAttendance attendance =
                TeacherAttendance.builder()
                        .teacher(teacher)
                        .attendanceDate(LocalDate.now())
                        .checkIn(LocalTime.now())
                        .scannerLocation(scannerLocation)
                        .status(AttendanceStatus.PRESENT)
                        .build();

        teacherAttendanceRepository.save(attendance);

    }

    private void markCheckOut(
            TeacherAttendance attendance
    ) {

        if (attendance.getCheckOut() != null) {

            throw new RuntimeException(
                    "Attendance already completed for today."
            );

        }
        LocalTime checkOut = LocalTime.now();

        attendance.setCheckOut(checkOut);

        attendance.setWorkingHours(

                calculateWorkingHours(

                        attendance.getCheckIn(),

                        checkOut

                )

        );

        teacherAttendanceRepository.save(attendance);

    }

    private String formatDuration(Duration duration) {

        if (duration == null) {
            return "--";
        }

        long hours = duration.toHours();

        long minutes = duration.toMinutesPart();

        return String.format("%02dh %02dm", hours, minutes);

    }

    private TodayAttendanceDto convertTodayAttendanceDto(
            TeacherAttendance attendance
    ) {

        if (attendance == null) {

            return TodayAttendanceDto.builder()
                    .checkIn("--")
                    .checkOut("--")
                    .workingHours("--")
                    .location("--")
                    .status("NOT_MARKED")
                    .build();
        }

        return TodayAttendanceDto.builder()

                .checkIn(
                        attendance.getCheckIn() == null
                                ? "--"
                                : attendance.getCheckIn().format(TIME_FORMATTER)
                )

                .checkOut(
                        attendance.getCheckOut() == null
                                ? "--"
                                : attendance.getCheckOut().format(TIME_FORMATTER)
                )

                .workingHours(
                        formatDuration(attendance.getWorkingHours())
                )

                .location(
                        attendance.getScannerLocation() == null
                                ? "--"
                                : attendance.getScannerLocation()
                )

                .status(
                        attendance.getStatus() == null
                                ? "NOT_MARKED"
                                : attendance.getStatus().name()
                )

                .build();
    }

    private AttendanceSocketEventDto buildSocketEvent(
            AttendanceStatusType status,
            String message,
            Teacher teacher,
            TeacherAttendance attendance
    ) {

        return AttendanceSocketEventDto.builder()
                .status(status)
                .message(message)
                .todayAttendance(convertTodayAttendanceDto(attendance))
                .recentActivity(getRecentActivity(teacher))
                .eventTime(LocalDateTime.now())
                .build();

    }
    private List<ActivityItemDto> getRecentActivity(
            Teacher teacher
    ) {

        List<ActivityItemDto> activities = new ArrayList<>();

        TeacherAttendance attendance =
                teacherAttendanceRepository
                        .findByTeacherAndAttendanceDate(
                                teacher,
                                LocalDate.now()
                        )
                        .orElse(null);

        String token = stringRedisTemplate.opsForValue()
                .get(buildTeacherKey(teacher.getId()));

        if (token != null) {

            AttendanceQR qr = getAttendanceQR(token);

            activities.add(
                    ActivityItemDto.builder()
                            .id(1L)
                            .title("QR Generated")
                            .description("Attendance QR has been generated.")
                            .time(qr.getGeneratedAt().format(TIME_FORMATTER))
                            .type(ActivityType.GENERATED)
                            .build()
            );
        }

        if (attendance != null && attendance.getCheckIn() != null) {

            activities.add(
                    ActivityItemDto.builder()
                            .id(2L)
                            .title("Check In")
                            .description("Attendance checked in successfully.")
                            .time(attendance.getCheckIn().format(TIME_FORMATTER))
                            .type(ActivityType.SUCCESS)
                            .build()
            );
        }

        if (attendance != null && attendance.getCheckOut() != null) {

            activities.add(
                    ActivityItemDto.builder()
                            .id(3L)
                            .title("Check Out")
                            .description("Attendance checked out successfully.")
                            .time(attendance.getCheckOut().format(TIME_FORMATTER))
                            .type(ActivityType.SUCCESS)
                            .build()
            );
        }

        return activities;
    }

    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("hh:mm a");


    public @Nullable QRCodeResponseDto generateQr() {
        try {

            Teacher teacher = getLoggedInTeacher();

            removeOldQr(teacher.getId());

            String token = generateToken();

            LocalDateTime generatedAt = LocalDateTime.now();

            LocalDateTime expiresAt = generatedAt.plusSeconds(60);

            AttendanceQR attendanceQR = AttendanceQR.builder()
                    .token(token)
                    .teacherId(teacher.getId())
                    .generatedAt(generatedAt)
                    .expiresAt(expiresAt)
                    .build();

            saveQrInRedis(attendanceQR);

            return QRCodeResponseDto.builder()
                    .token(token)
                    .expiresAt(expiresAt)
                    .build();

        } catch (Exception e) {

            throw new RuntimeException("Unable to generate QR Code.", e);

        }

    }

    public AttendanceScanResponseDto verifyQr(
            AttendanceScanRequest request,
            String scannerLocation
    ) {


        AttendanceQR attendanceQR =
                getAttendanceQR(request.getToken());

        Teacher teacher =
                getTeacher(attendanceQR.getTeacherId());
        TeacherAttendance attendance =
                getTodayAttendance(teacher);

        attendancePublisher.publish(

                teacher.getUser().getId(),

                buildSocketEvent(

                        AttendanceStatusType.SCANNED,

                        "QR Code scanned.",

                        teacher,

                        attendance

                )
        );

        if (attendance == null) {

            markCheckIn(
                    teacher,
                    scannerLocation
            );

            attendance =
                    getTodayAttendance(teacher);


            attendancePublisher.publish(

                    teacher.getUser().getId(),

                    buildSocketEvent(

                            AttendanceStatusType.SUCCESS,

                            "Check In recorded successfully.",

                            teacher,

                            attendance

                    )

            );
            deleteQr(attendanceQR);

            return AttendanceScanResponseDto.builder()
                    .message("Check In recorded successfully.")
                    .type("CHECK_IN")
                    .deviceName(scannerLocation)
                    .teacherName(userMappingService.getNameUser(teacher.getUser()))
                    .employeeId(teacher.getUser().getUsername())
                    .department(teacher.getUser().getUserRoleUser().toString())
                    .attendanceTime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm:ss a")).toString())
                    .build();

        }

        markCheckOut(attendance);


        attendancePublisher.publish(

                teacher.getUser().getId(),

                buildSocketEvent(

                        AttendanceStatusType.SUCCESS,

                        "Check Out recorded successfully.",

                        teacher,

                        attendance

                )

        );
        deleteQr(attendanceQR);

        return AttendanceScanResponseDto.builder()
                .message("Check Out recorded successfully.")
                .type("CHECK_OUT")
                .deviceName(scannerLocation)
                .teacherName(userMappingService.getNameUser(teacher.getUser()))
                .employeeId(teacher.getUser().getUsername())
                .department(teacher.getUser().getUserRoleUser().toString())
                .attendanceTime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm:ss a")).toString())
                .build();

    }

    public @Nullable QRCodeResponseDto refreshQr() {
        return generateQr();
    }

    public @Nullable TodayAttendanceDto getTodayAttendance() {
        Teacher teacher = getLoggedInTeacher();

        TeacherAttendance attendance =
                teacherAttendanceRepository
                        .findByTeacherAndAttendanceDate(
                                teacher,
                                LocalDate.now()
                        )
                        .orElse(null);

        return convertTodayAttendanceDto(attendance);
    }

    public @Nullable List<ActivityItemDto> getRecentActivity() {
        Teacher teacher = getLoggedInTeacher();
        return getRecentActivity(teacher);
    }
}
