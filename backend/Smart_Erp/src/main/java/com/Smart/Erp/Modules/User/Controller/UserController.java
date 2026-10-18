package com.Smart.Erp.Modules.User.Controller;

import com.Smart.Erp.Modules.File.DTO.FileResponse;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileRequest;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.Smart.Erp.Modules.User.Services.UserService;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping( "/{role:user|program-coordinator|head-of-department|admin|school-dean|dean|super-admin}/user")
@AllArgsConstructor
public class UserController {

    private final FileService fileService;
    private final UserService userService;

    @GetMapping({"/photo"})
    public ResponseEntity<Resource> getFile(@RequestParam(required = false) Long userId, Authentication authentication) {
        String username = authentication.getName();

        FileMetadata fileMetadata = userService.getPhoto(userId, username);

        FileResponse response = fileService.getFile(fileMetadata);

        MediaType mediaType = MediaType.parseMediaType(response.contentType());

        return ResponseEntity.ok().contentType(mediaType).contentLength(response.contentLength()).header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(response.filename()).build().toString()).body(response.resource());
    }

    @PostMapping(
            consumes = "multipart/form-data"
    )
    public ResponseEntity<UserProfileResponse> update(
            @RequestParam(required = false) Long userid,
            @RequestPart("details")
            UserProfileRequest request,
            @RequestPart(
                    value = "file",
                    required = false
            )
            MultipartFile file,
            Authentication authentication
    ) {

        UserProfileResponse response =
                userService.update(
                        authentication.getName(), request, file, userid
                );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @RequestParam String oldPassword,
            @RequestParam String newPassword,
            Authentication authentication
    ) {
        String username = authentication.getName();
        userService.changePassword(username, oldPassword, newPassword);
        return ResponseEntity.ok("Password changed successfully");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @RequestParam String userId,
            Authentication authentication
    ) {
        userService.resetPassword(authentication.getName(),userId);
        return ResponseEntity.ok("Password reset successfully");
    }

    @PostMapping("/change-enable")
    public ResponseEntity<String> changeEnable(
            @RequestParam String userId,
            @RequestParam Boolean enable,
            Authentication authentication
    ) {
        userService.changeEnable(enable,authentication.getName(),userId);
        return ResponseEntity.ok("Password reset successfully");
    }
}
