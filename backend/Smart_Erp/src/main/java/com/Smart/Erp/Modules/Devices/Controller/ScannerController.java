package com.Smart.Erp.Modules.Devices.Controller;

import com.Smart.Erp.Modules.Teacher.DTO.MyAttendence.AttendanceScanRequest;
import com.Smart.Erp.Modules.Teacher.DTO.MyAttendence.AttendanceScanResponseDto;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.Teacher.Services.TeacherAttendanceService;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
public class ScannerController {

    private final TeacherAttendanceService teacherAttendanceService;
    private final UserCommonService userService;

    @PostMapping("/mark")
    public ResponseEntity<AttendanceScanResponseDto> verifyQr(

            @RequestBody AttendanceScanRequest request,
            Authentication authentication

    ) {
        String username = authentication.getName();
        User user = userService.getUser(username);
        return ResponseEntity.ok(

                teacherAttendanceService.verifyQr(
                        request,
                        user.getDevices().getLocation()
                )

        );

    }

}