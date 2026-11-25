package com.Smart.Erp.Modules.Attendance.Controller;

import com.Smart.Erp.Modules.Attendance.DTO.GuardDecisionRequest;
import com.Smart.Erp.Modules.Attendance.DTO.GuardDecisionResponse;
import com.Smart.Erp.Modules.Attendance.DTO.GuardScanRequest;
import com.Smart.Erp.Modules.Attendance.DTO.GuardStudentDetailResponse;
import com.Smart.Erp.Modules.Attendance.Services.GuardApprovalService;
import com.Smart.Erp.Modules.File.DTO.FileResponse;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/security-guard/check-in")
@RequiredArgsConstructor
public class SecurityGuardCheckInController {

    private final GuardApprovalService guardApprovalService;
    private final StudentRepo studentRepo;
    private final FileService fileService;

    @PostMapping("/scan")
    public ResponseEntity<GuardStudentDetailResponse> scanToken(
            @RequestBody GuardScanRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                guardApprovalService.scanStudentCheckIn(request.getCheckInToken(), authentication.getName())
        );
    }

    @PostMapping("/decision")
    public ResponseEntity<GuardDecisionResponse> makeDecision(
            @RequestBody GuardDecisionRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                guardApprovalService.processGuardDecision(request, authentication.getName())
        );
    }

    @GetMapping("/photo/{studentId}")
    public ResponseEntity<Resource> getStudentRegisteredPhoto(
            @PathVariable Long studentId,
            Authentication authentication
    ) {
        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getUser() == null || student.getUser().getBasicDetail() == null ||
                student.getUser().getBasicDetail().getPhoto() == null) {
            return ResponseEntity.notFound().build();
        }

        FileMetadata photo = student.getUser().getBasicDetail().getPhoto();
        FileResponse response = fileService.getFile(photo);

        MediaType mediaType = MediaType.IMAGE_JPEG;
        if (response.contentType() != null && !response.contentType().isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(response.contentType());
            } catch (Exception ignored) {
                mediaType = MediaType.IMAGE_JPEG;
            }
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(response.contentLength())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(response.filename() != null ? response.filename() : "student_photo.jpg").build().toString())
                .body(response.resource());
    }
}
