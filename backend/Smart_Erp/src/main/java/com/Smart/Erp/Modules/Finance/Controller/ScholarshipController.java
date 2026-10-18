package com.Smart.Erp.Modules.Finance.Controller;

import com.Smart.Erp.Modules.Finance.DTO.Scholarship.ScholarshipRequest;
import com.Smart.Erp.Modules.Finance.DTO.Scholarship.ScholarshipResponse;
import com.Smart.Erp.Modules.Finance.Services.ScholarshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:admin|dean|super-admin}/scholarships")
@RequiredArgsConstructor
public class ScholarshipController {
    private final ScholarshipService scholarshipService;

    @GetMapping
    public ResponseEntity<List<ScholarshipResponse>> getScholarships() {
        List<ScholarshipResponse> response = scholarshipService.getScholarships();
        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).UNIVERSITY, " +
                    "#universityId)")
    @PostMapping
    public ResponseEntity<ScholarshipResponse> createScholarship(
            @RequestParam Long universityId,
            @RequestBody ScholarshipRequest request
    ) {
        return ResponseEntity.ok(scholarshipService.createScholarship(universityId, request));
    }

    @PutMapping
    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SCHOLARSHIP, " +
                    "#id)")
    public ResponseEntity<ScholarshipResponse> updateScholarship(
            @RequestParam Long id,
            @RequestBody ScholarshipRequest request
    ) {
        return ResponseEntity.ok(scholarshipService.updateScholarship(id, request));
    }


    @DeleteMapping
    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SCHOLARSHIP, " +
                    "#id)")
    public ResponseEntity<String> deleteScholarship(
            @RequestParam Long id
    ) {
        return ResponseEntity.ok(scholarshipService.deleteScholarship(id));
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).UNIVERSITY, " +
                    "#universityId) || " +
                    "(#id != null && " +
                    "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SCHOLARSHIP, " +
                    "#id))"
    )
    @GetMapping("/prefix")
    public ResponseEntity<String> getPrefix(
            @RequestParam(required = false) Long id,
            @RequestParam Long universityId
    ) {
        return ResponseEntity.ok(scholarshipService.getPrefix(universityId));
    }
}
