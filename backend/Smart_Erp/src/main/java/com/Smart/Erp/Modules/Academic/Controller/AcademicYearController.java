package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Modules.Academic.DTO.AcademicYear.AcademicYearRequest;
import com.Smart.Erp.Modules.Academic.DTO.AcademicYear.AcademicYearResponse;
import com.Smart.Erp.Modules.Academic.Services.AcademicYearService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping({
        "/super-admin/academic-year",
        "/{role:admin|dean|super-admin}/{universityId}/academic-year"
})
//here i want to pass like this UserRoles.ADMIN
@PreAuthorize("@securityVerifier.hasAccessToUniversity(#universityId)")
public class AcademicYearController {
    private final AcademicYearService academicYearService;

    @GetMapping
    @PreAuthorize("@authVerifier.can(T(com.Smart.Erp.Modules.User.Enum.PermissionAction).READ, T(com.Smart.Erp.Modules.User.Enum.ResourceType).UNIVERSITY, #universityId)")
    public ResponseEntity<List<AcademicYearResponse>> getAcademicYears(
            @PathVariable Long universityId
    ){
        return ResponseEntity.ok(academicYearService.getAcademicYears(universityId));
    }

    @PostMapping
    public ResponseEntity<AcademicYearResponse> createAcademicYear(
            @PathVariable Long universityId,
            @RequestBody AcademicYearRequest academicYearRequest
    ){
        return ResponseEntity.ok(academicYearService.createAcademicYear(universityId,academicYearRequest));
    }

    @PutMapping
    public ResponseEntity<AcademicYearResponse> updateAcademicYear(
            @PathVariable Long universityId,
            @RequestParam Long academicYearId,
            @RequestBody AcademicYearRequest academicYearRequest
    ){
        return ResponseEntity.ok(academicYearService.updateAcademicYear(universityId,academicYearId,academicYearRequest));
    }

    @DeleteMapping
    public ResponseEntity<String> deleteAcademicYear(
            @PathVariable Long universityId,
            @RequestParam Long academicYearId
    ){
        return ResponseEntity.ok(academicYearService.deleteAcademicYear(universityId,academicYearId));
    }

    @PostMapping("/switch")
    public ResponseEntity<String> switchToCurrentYear(
            @RequestParam Long universityID,
            @RequestParam Long academicYearId
    ){
        academicYearService.switchAcademicYear(universityID,academicYearId);
        return ResponseEntity.ok("Academic Year switched successfully");
    }
}
