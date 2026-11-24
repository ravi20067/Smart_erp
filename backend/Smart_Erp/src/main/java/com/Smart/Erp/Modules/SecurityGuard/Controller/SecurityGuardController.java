package com.Smart.Erp.Modules.SecurityGuard.Controller;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.File.DTO.FileResponse;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.SecurityGuard.DTO.SecurityGuardRequest;
import com.Smart.Erp.Modules.SecurityGuard.DTO.SecurityGuardResponse;
import com.Smart.Erp.Modules.SecurityGuard.Services.SecurityGuardService;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileRequest;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/{role:head-of-department|admin|dean|super-admin}/security-guard")
@RequiredArgsConstructor
public class SecurityGuardController {

    private final SecurityGuardService securityGuardService;
    private final FileService fileService;

    @GetMapping
    public ResponseEntity<List<SecurityGuardResponse>> getSecurityGuards() {
        return ResponseEntity.ok(securityGuardService.get());
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).READ," +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECURITY_GUARD," +
                    "#userId)")
    @GetMapping("/photo")
    public ResponseEntity<Resource> getPhoto(@RequestParam Long userId) {
        FileMetadata fileMetadata = securityGuardService.getPhoto(userId);
        FileResponse response = fileService.getFile(fileMetadata);
        MediaType mediaType = MediaType.parseMediaType(response.contentType());
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(response.contentLength())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(response.filename()).build().toString())
                .body(response.resource());
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).UNIVERSITY," +
                    "#universityID)")
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<SecurityGuardResponse> saveSecurityGuardDetails(
            @RequestParam Long universityID,
            @RequestPart("details") SecurityGuardRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(securityGuardService.create(universityID, request, file));
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECURITY_GUARD, " +
                    "#guardId)")
    @PostMapping(path = "/update/profile", consumes = "multipart/form-data")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestParam Long guardId,
            @RequestPart("details") UserProfileRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(securityGuardService.updateProfile(guardId, request, file));
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECURITY_GUARD, " +
                    "#guardId)")
    @PutMapping("/update/details")
    public ResponseEntity<SecurityGuardResponse> updateGuardDetails(
            @RequestParam Long guardId,
            @RequestBody SecurityGuardRequest request
    ) {
        return ResponseEntity.ok(securityGuardService.updateGuardDetails(guardId, request));
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECURITY_GUARD, " +
                    "#guardId)")
    @PostMapping("/update/profile/change-enable")
    public ResponseEntity<String> changeEnable(
            @RequestParam Long guardId,
            @RequestParam Boolean enable
    ) {
        securityGuardService.changeEnable(guardId, enable);
        return ResponseEntity.ok("Security guard account status changed successfully.");
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECURITY_GUARD, " +
                    "#guardId)")
    @PostMapping("/update/profile/reset-password")
    public ResponseEntity<String> resetPassword(@RequestParam Long guardId) {
        securityGuardService.resetPassword(guardId);
        return ResponseEntity.ok("Security guard password reset successfully.");
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECURITY_GUARD, " +
                    "#guardId)")
    @DeleteMapping
    public ResponseEntity<String> delete(@RequestParam Long guardId) {
        securityGuardService.delete(guardId);
        return ResponseEntity.ok("Security guard record deleted successfully.");
    }

    @GetMapping("/filter/university")
    public ResponseEntity<List<CommonDTO>> filterUniversity() {
        return ResponseEntity.ok(securityGuardService.filterUniversity());
    }
}
