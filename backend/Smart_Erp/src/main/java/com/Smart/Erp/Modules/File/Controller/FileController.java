package com.Smart.Erp.Modules.File.Controller;


import com.Smart.Erp.Modules.File.DTO.FileResponse;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.User.Services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final UserService userService;

    @GetMapping({
            "/admin/user/photo"
    })
    public ResponseEntity<Resource> getFile(
            @RequestParam(required = false) Long userId,
            Authentication authentication
    ) {
        String username = authentication.getName();

        UUID fileId = userService.getPhoto(userId,username);

        FileResponse response =
                fileService.getFile(fileId);

        MediaType mediaType =
                MediaType.parseMediaType(
                        response.contentType()
                );

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(response.contentLength())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition
                                .inline()
                                .filename(
                                        response.filename()
                                )
                                .build()
                                .toString()
                )
                .body(response.resource());
    }
}
