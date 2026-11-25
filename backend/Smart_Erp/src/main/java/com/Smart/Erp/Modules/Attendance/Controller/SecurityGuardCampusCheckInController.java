package com.Smart.Erp.Modules.Attendance.Controller;

import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Attendance.DTO.CampusDecisionRequest;
import com.Smart.Erp.Modules.Attendance.DTO.CampusDecisionResponse;
import com.Smart.Erp.Modules.Attendance.DTO.CampusGuardScanResponse;
import com.Smart.Erp.Modules.Attendance.DTO.CampusHistoryItemDto;
import com.Smart.Erp.Modules.Attendance.Services.CampusCheckInService;
import com.Smart.Erp.Modules.File.DTO.FileResponse;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/security-guard/campus-check-in")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('SECURITY_GUARD')")
public class SecurityGuardCampusCheckInController {

    private final CampusCheckInService campusCheckInService;
    private final UserRepo userRepo;
    private final FileService fileService;

    @PostMapping("/scan")
    public ResponseEntity<CampusGuardScanResponse> scanCampusQr(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        String qrToken = body != null ? body.get("qrToken") : null;
        return ResponseEntity.ok(campusCheckInService.scanCampusQr(qrToken, authentication.getName()));
    }

    @PostMapping("/decision")
    public ResponseEntity<CampusDecisionResponse> makeDecision(
            @RequestBody CampusDecisionRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(campusCheckInService.processGuardDecision(request, authentication.getName()));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<CampusHistoryItemDto>> getRecentLogs(Authentication authentication) {
        return ResponseEntity.ok(campusCheckInService.getRecentCampusLogsForGuard(authentication.getName()));
    }

    @GetMapping("/photo/{userId}")
    public ResponseEntity<Resource> getRegisteredPhoto(@PathVariable Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getBasicDetail() == null || user.getBasicDetail().getPhoto() == null) {
            return ResponseEntity.notFound().build();
        }

        FileMetadata photo = user.getBasicDetail().getPhoto();
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
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline()
                                .filename(response.filename() != null ? response.filename() : "profile_photo.jpg")
                                .build()
                                .toString()
                )
                .body(response.resource());
    }
}
