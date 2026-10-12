package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.DTO.School.SchoolRequest;
import com.Smart.Erp.Modules.Academic.DTO.School.SchoolResponse;
import com.Smart.Erp.Modules.Academic.Services.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({
        "/{role:admin|dean|super-admin}/school"
})
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;

    @GetMapping
    public ResponseEntity<List<SchoolResponse>> getSchool() {
        return ResponseEntity.ok(schoolService.findSchool());
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).UNIVERSITY, " +
            "#universityId)")
    @PostMapping
    public ResponseEntity<SchoolResponse> createSchool(
            @RequestParam Long universityId,
            @RequestBody CommonRequest request
    ) {
        return ResponseEntity.ok(schoolService.createSchool(universityId, request));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SCHOOL, " +
            "#schoolRequest.id)")
    @PutMapping
    public ResponseEntity<SchoolResponse> updateSchool(
            @RequestBody SchoolRequest schoolRequest
    ) {
        return ResponseEntity.ok(schoolService.updateSchool(schoolRequest));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SCHOOL, " +
            "#schoolId)")
    @DeleteMapping
    public ResponseEntity<String> deleteSchool(
            @RequestParam Long schoolId
    ) {
        return ResponseEntity.ok(
                schoolService.deleteSchool(
                        schoolId
                )
        );
    }
    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).UNIVERSITY, " +
                    "#universityId) || " +
                    "(#schoolId != null && " +
                    "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SCHOOL, " +
                    "#schoolId))"
    )
    @GetMapping("/prefix")
    public ResponseEntity<String> getPrefix(
            @RequestParam(required = false) Long schoolId,
            @RequestParam Long universityId
    ) {
        return ResponseEntity.ok(schoolService.getPrefix(universityId));
    }
}
