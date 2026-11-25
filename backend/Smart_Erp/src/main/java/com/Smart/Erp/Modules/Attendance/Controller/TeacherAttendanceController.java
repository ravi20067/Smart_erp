package com.Smart.Erp.Modules.Attendance.Controller;

import com.Smart.Erp.Modules.Attendance.DTO.AttendanceSessionResponse;
import com.Smart.Erp.Modules.Attendance.DTO.AttendanceStatsResponse;
import com.Smart.Erp.Modules.Attendance.DTO.StartAttendanceRequest;
import com.Smart.Erp.Modules.Attendance.Services.AttendanceSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/teacher/attendance")
@RequiredArgsConstructor
public class TeacherAttendanceController {

    private final AttendanceSessionService sessionService;

    @PostMapping("/sessions/start")
    public ResponseEntity<AttendanceSessionResponse> startSession(
            @RequestBody StartAttendanceRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(sessionService.startSession(request, authentication.getName()));
    }

    @PostMapping("/sessions/{sessionUuid}/stop")
    public ResponseEntity<AttendanceSessionResponse> stopSession(
            @PathVariable String sessionUuid,
            Authentication authentication
    ) {
        return ResponseEntity.ok(sessionService.stopSession(sessionUuid, authentication.getName()));
    }

    @GetMapping("/sessions/active")
    public ResponseEntity<AttendanceSessionResponse> getActiveSession(Authentication authentication) {
        AttendanceSessionResponse session = sessionService.getActiveSession(authentication.getName());
        return session != null ? ResponseEntity.ok(session) : ResponseEntity.noContent().build();
    }

    @PostMapping("/sessions/{sessionUuid}/qr/refresh")
    public ResponseEntity<Map<String, String>> refreshQr(
            @PathVariable String sessionUuid,
            Authentication authentication
    ) {
        String qrPayload = sessionService.refreshQr(sessionUuid, authentication.getName());
        return ResponseEntity.ok(Map.of("qrPayload", qrPayload));
    }

    @GetMapping("/filters")
    public ResponseEntity<Map<String, Object>> getFilters(Authentication authentication) {
        return ResponseEntity.ok(sessionService.getAttendanceFilters(authentication != null ? authentication.getName() : null));
    }

    @GetMapping("/sessions/{sessionUuid}/stats")
    public ResponseEntity<AttendanceStatsResponse> getStats(@PathVariable String sessionUuid) {
        return ResponseEntity.ok(sessionService.getSessionStats(sessionUuid));
    }
}
