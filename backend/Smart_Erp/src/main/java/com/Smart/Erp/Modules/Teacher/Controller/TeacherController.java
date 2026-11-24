package com.Smart.Erp.Modules.Teacher.Controller;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.File.DTO.FileResponse;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.Teacher.DTO.Teacher.TeacherRequest;
import com.Smart.Erp.Modules.Teacher.DTO.Teacher.TeacherResponse;
import com.Smart.Erp.Modules.Teacher.Services.TeacherService;
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
@RequestMapping("/{role:head-of-department|admin|dean|super-admin}/teacher")
@RequiredArgsConstructor
public class TeacherController{

    private final TeacherService teacherService;
    private final FileService fileService;

    @GetMapping
    public ResponseEntity<List<TeacherResponse>> getTeacher(
    ){
        List<TeacherResponse> response =
                teacherService.get();
        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).READ," +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).TEACHER," +
                    "#userId)")
    @GetMapping({"/photo"})
    public ResponseEntity<Resource> getPhoto(@RequestParam  Long userId) {
        FileMetadata fileMetadata = teacherService.getPhoto(userId);
        FileResponse response = fileService.getFile(fileMetadata);
        MediaType mediaType = MediaType.parseMediaType(response.contentType());
        return ResponseEntity.ok().contentType(mediaType).contentLength(response.contentLength()).header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(response.filename()).build().toString()).body(response.resource());
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).UNIVERSITY," +
                    "#universityID)")
    @PostMapping(
            consumes = "multipart/form-data"
    )
    public ResponseEntity<TeacherResponse> saveTeacherDetails(
            @RequestParam
            Long universityID,
            @RequestPart("details")
            TeacherRequest request,
            @RequestPart(
                    value = "file",
                    required = false
            )
            MultipartFile file
    ) {

        TeacherResponse response =
                teacherService.create(
                        universityID,
                        request,
                        file
                );

        return ResponseEntity.ok(response);
    }

    // Update teacher profile(if update photo then send file in multipart form data if not then send null in file)
    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).TEACHER, " +
                    "#teacherId)")
    @PostMapping(
            path = {"/update/profile"},
            consumes = "multipart/form-data"
    )
    public ResponseEntity<UserProfileResponse> update(
            @RequestParam Long teacherId,
            @RequestPart("details")
            UserProfileRequest request,
            @RequestPart(
                    value = "file",
                    required = false
            )
            MultipartFile file
    ) {

        UserProfileResponse response =
                teacherService.updateProfile(
                        teacherId,
                        request,
                        file
                );

        return ResponseEntity.ok(response);
    }
    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).TEACHER, " +
                    "#teacherId)")
    @PostMapping("/update/profile/change-enable")
    public ResponseEntity<String> changeEnable(
            @RequestParam Long teacherId,
            @RequestParam Boolean enable
    ){
        teacherService.changeEnable(
                teacherId,
                enable
        );
        return ResponseEntity.ok("Teacher enable status changed successfully");
    }
    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).TEACHER, " +
                    "#teacherId)")
    @PostMapping("/update/profile/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestParam Long teacherId
    ){
        teacherService.resetPassword(teacherId);
        return ResponseEntity.ok("Password reset successfully");
    }

    @GetMapping("/filter/university")
    public ResponseEntity<List<CommonDTO>> filterSectionGroup() {
        return ResponseEntity.ok(teacherService.filterUniversity());
    }
}



