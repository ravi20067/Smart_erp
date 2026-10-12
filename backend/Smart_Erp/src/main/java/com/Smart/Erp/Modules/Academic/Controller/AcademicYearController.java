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
        "/{role:head-of-department|admin|dean|super-admin}/academic-year"
})
public class AcademicYearController {
    private final AcademicYearService academicYearService;

    @GetMapping
    public ResponseEntity<List<AcademicYearResponse>> getAcademicYears(){
        return ResponseEntity.ok(academicYearService.getAcademicYears());
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).DEPARTMENT, " +
            "#departmentId)")
    @PostMapping
    public ResponseEntity<AcademicYearResponse> createAcademicYear(
            @RequestParam Long departmentId,
            @RequestBody AcademicYearRequest academicYearRequest
    ){
        return ResponseEntity.ok(academicYearService.createAcademicYear(departmentId,academicYearRequest));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ACADEMIC_YEAR, " +
            "#academicYearId)")
    @PutMapping
    public ResponseEntity<AcademicYearResponse> updateAcademicYear(
            @RequestParam Long academicYearId,
            @RequestBody AcademicYearRequest academicYearRequest
    ){
        return ResponseEntity.ok(academicYearService.updateAcademicYear(academicYearId,academicYearRequest));
    }


    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ACADEMIC_YEAR, " +
            "#academicYearId)")
    @DeleteMapping
    public ResponseEntity<String> deleteAcademicYear(
            @RequestParam Long academicYearId
    ){
        return ResponseEntity.ok(academicYearService.deleteAcademicYear(academicYearId));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ACADEMIC_YEAR, " +
            "#academicYearId)")
    @PostMapping("/switch")
    public ResponseEntity<String> switchToCurrentYear(
            @RequestParam Long departmentId,
            @RequestParam Long academicYearId
    ){
        academicYearService.switchAcademicYear(departmentId,academicYearId);
        return ResponseEntity.ok("Academic Year switched successfully");
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).DEPARTMENT, " +
                    "#departmentId) || " +
                    "(#academicYearId != null && " +
                    "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ACADEMIC_YEAR, " +
                    "#academicYearId))"
    )
    @GetMapping("/prefix")
    public ResponseEntity<String> getPrefix(
            @RequestParam(required = false) Long academicYearId,
            @RequestParam Long departmentId
    ) {
        return ResponseEntity.ok(academicYearService.getPrefix(departmentId));
    }
}
