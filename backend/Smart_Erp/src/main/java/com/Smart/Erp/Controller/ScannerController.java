package com.Smart.Erp.Controller;

import com.Smart.Erp.DTO.Teacher.MyAttendence.AttendanceScanRequest;
import com.Smart.Erp.DTO.Teacher.MyAttendence.AttendanceScanResponseDto;
import com.Smart.Erp.Entity.User;
import com.Smart.Erp.Service.CommonService;
import com.Smart.Erp.Service.TeacherAttendanceService;
import com.Smart.Erp.Service.UserService;
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
    private final CommonService commonService;

    @PostMapping("/mark")
    public ResponseEntity<AttendanceScanResponseDto> verifyQr(

            @RequestBody AttendanceScanRequest request,
            Authentication authentication

    ) {
        String username = authentication.getName();
        User user = commonService.getUser(username);
        return ResponseEntity.ok(

                teacherAttendanceService.verifyQr(
                        request,
                        user.getDevices().getLocation()
                )

        );

    }

}