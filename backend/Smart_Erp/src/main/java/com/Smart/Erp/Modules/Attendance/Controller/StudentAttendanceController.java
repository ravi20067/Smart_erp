package com.Smart.Erp.Modules.Attendance.Controller;

import com.Smart.Erp.Modules.Attendance.DTO.*;
import com.Smart.Erp.Modules.Attendance.Entity.StudentAttendance;
import com.Smart.Erp.Modules.Attendance.Repo.StudentAttendanceRepository;
import com.Smart.Erp.Modules.Attendance.Services.CheckInService;
import com.Smart.Erp.Modules.Attendance.Services.FaceVerificationService;
import com.Smart.Erp.Modules.Attendance.Services.LocalHandshakeService;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/student/attendance")
@RequiredArgsConstructor
public class StudentAttendanceController {

    private final FaceVerificationService faceVerificationService;
    private final LocalHandshakeService localHandshakeService;
    private final CheckInService checkInService;
    private final StudentAttendanceRepository attendanceRepository;
    private final StudentRepo studentRepo;
    private final UserRepo userRepo;

    @PostMapping("/verification/start")
    public ResponseEntity<StudentVerificationStartResponse> startVerification(
            @RequestBody StudentVerificationStartRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                faceVerificationService.startVerification(request.getSessionUuid(), authentication.getName())
        );
    }

    @PostMapping(value = "/verification/{verificationSessionId}/challenge", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChallengeSubmissionResponse> submitChallenge(
            @PathVariable String verificationSessionId,
            @RequestParam("action") String action,
            @RequestParam(value = "sequenceNumber", defaultValue = "1") int sequenceNumber,
            @RequestPart("frames") List<MultipartFile> frames,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                faceVerificationService.processChallengeFrames(
                        verificationSessionId,
                        action,
                        sequenceNumber,
                        frames,
                        authentication.getName()
                )
        );
    }

    @PostMapping("/handshake/ticket")
    public ResponseEntity<StudentHandshakeTicketResponse> issueHandshakeTicket(
            @RequestBody StudentHandshakeTicketRequest request,
            HttpServletRequest httpRequest,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                localHandshakeService.issueHandshakeTicket(request, authentication.getName(), extractHeaders(httpRequest))
        );
    }

    @PostMapping("/handshake/verify")
    public ResponseEntity<LocalHandshakeResponse> verifyHandshake(
            @RequestBody LocalHandshakeRequest request,
            HttpServletRequest httpRequest,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                localHandshakeService.verifyHandshake(request, authentication.getName(), extractHeaders(httpRequest))
        );
    }

    private Map<String, String> extractHeaders(HttpServletRequest request) {
        Map<String, String> headers = new LinkedHashMap<>();
        if (request == null) {
            return headers;
        }
        Enumeration<String> names = request.getHeaderNames();
        if (names != null) {
            while (names.hasMoreElements()) {
                String name = names.nextElement();
                headers.put(name, request.getHeader(name));
            }
        }
        return headers;
    }

    @GetMapping("/checkin/qr")
    public ResponseEntity<StudentCheckInQRResponse> getCheckInQr(
            @RequestParam("sessionUuid") String sessionUuid,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                checkInService.generateStudentCheckInQR(sessionUuid, authentication.getName())
        );
    }

    @GetMapping("/face-template")
    public ResponseEntity<Map<String, Object>> getMyFaceTemplate(Authentication authentication) {
        User user = userRepo.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        var template = student.getFaceTemplate();
        boolean registered = student.hasActiveFaceTemplate();
        boolean hasProfilePhoto = user.getBasicDetail() != null && user.getBasicDetail().getPhoto() != null;

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("studentId", student.getId());
        response.put("registrationNumber", student.getRegistrationNumber());
        response.put("registered", registered);
        response.put("status", template != null ? template.getStatus() : "NOT_REGISTERED");
        response.put("algorithm", template != null ? template.getAlgorithm() : null);
        response.put("embeddingDimension", template != null ? template.getEmbeddingDimension() : null);
        response.put("enrolledAt", template != null && template.getEnrolledAt() != null ? template.getEnrolledAt().toString() : null);
        response.put("hasProfilePhoto", hasProfilePhoto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<StudentAttendanceHistoryDto>> getAttendanceHistory(Authentication authentication) {
        User user = userRepo.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Student student = studentRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<StudentAttendance> attendances = attendanceRepository.findAllByStudentOrderByAttendanceDateDesc(student);

        List<StudentAttendanceHistoryDto> history = attendances.stream()
                .map(att -> {
                    String courseName = "N/A";
                    String sectionName = "N/A";
                    String subjectName = "N/A";
                    String teacherName = "Faculty";
                    String sessionUuid = "";

                    if (att.getAttendanceSession() != null) {
                        sessionUuid = att.getAttendanceSession().getSessionUuid() != null ? att.getAttendanceSession().getSessionUuid() : "";
                        if (att.getAttendanceSession().getCourse() != null) {
                            courseName = att.getAttendanceSession().getCourse().getName();
                        }
                        if (att.getAttendanceSession().getSection() != null) {
                            sectionName = att.getAttendanceSession().getSection().getName();
                        }
                        if (att.getAttendanceSession().getSubject() != null) {
                            subjectName = att.getAttendanceSession().getSubject().getName();
                        }
                        if (att.getAttendanceSession().getTeacher() != null &&
                                att.getAttendanceSession().getTeacher().getUser() != null &&
                                att.getAttendanceSession().getTeacher().getUser().getBasicDetail() != null) {
                            teacherName = att.getAttendanceSession().getTeacher().getUser().getBasicDetail().getFirstName() + " " +
                                    att.getAttendanceSession().getTeacher().getUser().getBasicDetail().getLastName();
                        }
                    }

                    return StudentAttendanceHistoryDto.builder()
                            .id(att.getId())
                            .sessionUuid(sessionUuid)
                            .attendanceDate(att.getAttendanceDate())
                            .checkInTime(att.getCheckInTime())
                            .courseName(courseName)
                            .sectionName(sectionName)
                            .subjectName(subjectName)
                            .teacherName(teacherName)
                            .status(att.getStatus() != null ? att.getStatus().name() : "PRESENT")
                            .similarityScore(att.getSimilarityScore())
                            .guardApproval(att.getGuardCheckInStatus() != null ? att.getGuardCheckInStatus().name() : "PENDING")
                            .remarks(att.getRemarks())
                            .build();
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(history);
    }
}
