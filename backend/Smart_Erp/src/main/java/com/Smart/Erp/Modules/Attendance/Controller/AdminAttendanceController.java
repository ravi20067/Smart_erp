package com.Smart.Erp.Modules.Attendance.Controller;

import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceAuditLog;
import com.Smart.Erp.Modules.Attendance.Entity.AttendanceSession;
import com.Smart.Erp.Modules.Attendance.Entity.StudentFaceTemplate;
import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import com.Smart.Erp.Modules.Attendance.Repo.AttendanceAuditLogRepository;
import com.Smart.Erp.Modules.Attendance.Repo.AttendanceSessionRepository;
import com.Smart.Erp.Modules.Attendance.Repo.StudentFaceTemplateRepository;
import com.Smart.Erp.Modules.Attendance.Services.AttendanceAuditService;
import com.Smart.Erp.Modules.Attendance.Services.FaceVerificationService;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/{role:head-of-department|admin|dean|super-admin}/attendance")
@RequiredArgsConstructor
public class AdminAttendanceController {

    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceAuditLogRepository auditLogRepository;
    private final StudentFaceTemplateRepository faceTemplateRepository;
    private final FaceVerificationService faceVerificationService;
    private final StudentRepo studentRepo;
    private final FileService fileService;
    private final AttendanceAuditService auditService;

    @GetMapping("/sessions")
    public ResponseEntity<List<AttendanceSession>> getAllSessions(
            @RequestParam(value = "status", required = false) AttendanceSessionStatus status
    ) {
        if (status != null) {
            return ResponseEntity.ok(sessionRepository.findAllByStatus(status));
        }
        return ResponseEntity.ok(sessionRepository.findAll());
    }

    @GetMapping("/audits")
    public ResponseEntity<List<AttendanceAuditLog>> getRecentAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findTop100ByOrderByTimestampDesc());
    }

    /**
     * Super Admin / Admin endpoint to enroll student face biometrics.
     * Can enroll from an uploaded image file or directly from the student's registered passport photo.
     */
    @PostMapping(value = "/students/{studentId}/enroll-face", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> enrollStudentFace(
            @PathVariable Long studentId,
            @RequestPart(value = "file", required = false) MultipartFile file,
            Authentication authentication
    ) {
        return ResponseEntity.ok(performFaceEnrollment(studentId, file, authentication));
    }

    /**
     * Non-multipart endpoint to enroll student face directly from registered ERP passport photo.
     */
    @PostMapping("/students/{studentId}/enroll-face/from-photo")
    public ResponseEntity<Map<String, Object>> enrollStudentFaceFromProfilePhoto(
            @PathVariable Long studentId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(performFaceEnrollment(studentId, null, authentication));
    }

    private Map<String, Object> performFaceEnrollment(
            Long studentId,
            MultipartFile file,
            Authentication authentication
    ) {
        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student with ID " + studentId + " not found"));

        byte[] photoBytes = null;
        String filename = "admin_enrolled_face.jpg";

        try {
            if (file != null && !file.isEmpty()) {
                photoBytes = file.getBytes();
                filename = normalizePhotoFilename(file.getOriginalFilename(), file.getContentType());
            } else if (student.getUser() != null &&
                    student.getUser().getBasicDetail() != null &&
                    student.getUser().getBasicDetail().getPhoto() != null) {
                FileMetadata photo = student.getUser().getBasicDetail().getPhoto();
                Resource res = fileService.getFile(photo).resource();
                try (InputStream is = res.getInputStream()) {
                    photoBytes = is.readAllBytes();
                    filename = normalizePhotoFilename(photo.getOriginalFilename(), photo.getContentType());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to read image bytes for enrollment: " + e.getMessage(), e);
        }

        if (photoBytes == null || photoBytes.length == 0) {
            throw new IllegalArgumentException("No face photo provided and student does not have a registered profile photo on file.");
        }

        StudentFaceTemplate template = faceVerificationService.enrollStudentFace(student, photoBytes, filename);

        auditService.logEvent(
                null, student, null, "ADMIN",
                "FACE_TEMPLATE_ENROLLED", "ACTIVE", "SUCCESS",
                "Face biometric template registered by admin " + (authentication != null ? authentication.getName() : "system"),
                null
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("studentId", student.getId());
        response.put("enrolled", true);
        response.put("algorithm", template.getAlgorithm());
        response.put("dimension", template.getEmbeddingDimension());
        response.put("enrolledAt", template.getEnrolledAt());
        response.put("message", "Student face biometric embedding successfully registered and encrypted at rest.");
        return response;
    }

    private String normalizePhotoFilename(String originalFilename, String contentType) {
        String name = (originalFilename != null && !originalFilename.isBlank())
                ? originalFilename.trim()
                : "student_face";
        String lower = name.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp")) {
            return name;
        }
        if ("image/png".equalsIgnoreCase(contentType)) {
            return name + ".png";
        }
        if ("image/webp".equalsIgnoreCase(contentType)) {
            return name + ".webp";
        }
        return name + ".jpg";
    }

    /**
     * Check if a student has an active enrolled face template.
     */
    @GetMapping("/students/{studentId}/face-status")
    public ResponseEntity<Map<String, Object>> getStudentFaceStatus(@PathVariable Long studentId) {
        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student with ID " + studentId + " not found"));

        Optional<StudentFaceTemplate> template = faceVerificationService.getStudentFaceTemplate(student);

        boolean hasProfilePhoto = student.getUser() != null &&
                student.getUser().getBasicDetail() != null &&
                student.getUser().getBasicDetail().getPhoto() != null;

        String studentName = student.getUser() != null && student.getUser().getBasicDetail() != null
                ? student.getUser().getBasicDetail().getFirstName() + " " + student.getUser().getBasicDetail().getLastName()
                : student.getRegistrationNumber();

        Map<String, Object> response = new HashMap<>();
        response.put("studentId", student.getId());
        response.put("studentName", studentName);
        response.put("registrationNumber", student.getRegistrationNumber());
        response.put("hasEnrolledFace", template.isPresent());
        response.put("hasProfilePhoto", hasProfilePhoto);
        if (template.isPresent()) {
            response.put("enrolledAt", template.get().getEnrolledAt());
            response.put("algorithm", template.get().getAlgorithm());
            response.put("dimension", template.get().getEmbeddingDimension());
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Delete/reset student face template if re-enrollment is required.
     */
    @DeleteMapping("/students/{studentId}/face-template")
    public ResponseEntity<Map<String, Object>> deleteStudentFaceTemplate(
            @PathVariable Long studentId,
            Authentication authentication
    ) {
        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student with ID " + studentId + " not found"));

        boolean deleted = faceVerificationService.deleteStudentFaceTemplate(student);

        if (deleted) {
            auditService.logEvent(
                    null, student, null, "ADMIN",
                    "FACE_TEMPLATE_DELETED", "DELETED", "SUCCESS",
                    "Face biometric template deleted by admin " + (authentication != null ? authentication.getName() : "system"),
                    null
            );
        }

        return ResponseEntity.ok(Map.of(
                "success", deleted,
                "message", deleted ? "Student face template successfully deleted" : "No face template found to delete"
        ));
    }

    /**
     * Batch face registration status map keyed by Student ID for Super Admin Student Management UI.
     */
    @GetMapping("/students/face-status-map")
    public ResponseEntity<Map<Long, Map<String, Object>>> getAllFaceStatuses() {
        Map<Long, Map<String, Object>> result = new HashMap<>();
        for (StudentFaceTemplate tpl : faceTemplateRepository.findAll()) {
            if (tpl.getStudent() != null) {
                Map<String, Object> info = new HashMap<>();
                info.put("enrolled", "ACTIVE".equalsIgnoreCase(tpl.getStatus()));
                info.put("algorithm", tpl.getAlgorithm());
                info.put("dimension", tpl.getEmbeddingDimension());
                info.put("enrolledAt", tpl.getEnrolledAt());
                result.put(tpl.getStudent().getId(), info);
            }
        }
        return ResponseEntity.ok(result);
    }
}
