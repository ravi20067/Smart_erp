package com.Smart.Erp.Modules.Attendance.Controller;

import com.Smart.Erp.Modules.Attendance.DTO.CampusHistoryItemDto;
import com.Smart.Erp.Modules.Attendance.DTO.CampusQrRequest;
import com.Smart.Erp.Modules.Attendance.DTO.CampusQrResponse;
import com.Smart.Erp.Modules.Attendance.DTO.CampusStatusResponse;
import com.Smart.Erp.Modules.Attendance.Enum.CampusCheckDirection;
import com.Smart.Erp.Modules.Attendance.Enum.CampusPersonRole;
import com.Smart.Erp.Modules.Attendance.Services.CampusCheckInService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/student/campus-check-in")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('STUDENT')")
public class StudentCampusCheckInController {

    private final CampusCheckInService campusCheckInService;

    @GetMapping("/status")
    public ResponseEntity<CampusStatusResponse> getStatus(Authentication authentication) {
        return ResponseEntity.ok(campusCheckInService.getStatus(authentication.getName(), CampusPersonRole.STUDENT));
    }

    @PostMapping("/qr")
    public ResponseEntity<CampusQrResponse> generateQr(
            @RequestBody CampusQrRequest request,
            Authentication authentication
    ) {
        CampusCheckDirection direction = request != null ? request.getDirection() : null;
        return ResponseEntity.ok(campusCheckInService.generateQr(authentication.getName(), CampusPersonRole.STUDENT, direction));
    }

    @GetMapping("/history")
    public ResponseEntity<List<CampusHistoryItemDto>> getHistory(Authentication authentication) {
        return ResponseEntity.ok(
                campusCheckInService.getStatus(authentication.getName(), CampusPersonRole.STUDENT).getRecentHistory()
        );
    }
}
