package com.Smart.Erp.Modules.Academic.Controller;


import com.Smart.Erp.Modules.Academic.DTO.Specialization.SpecializationRequest;
import com.Smart.Erp.Modules.Academic.DTO.Specialization.SpecializationResponse;
import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.Services.SpecializationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:program-coordinator|head-of-department|admin|dean|school-dean|super-admin}/specializations")
@RequiredArgsConstructor
public class SpecializationController {
    private final SpecializationService specializationService;
    @GetMapping
    public ResponseEntity<List<SpecializationResponse>> getAll(
    ){
        return ResponseEntity.ok(specializationService.getAll());
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
            "#courseId)")
    @PostMapping
    public ResponseEntity<SpecializationResponse> create(
            @RequestParam Long courseId,
            @RequestBody CommonRequest request
    ){
        return ResponseEntity.ok(specializationService.create(courseId,request));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SPECIALIZATION, " +
            "#request.id)")
    @PutMapping
    public ResponseEntity<SpecializationResponse> update(
            @RequestBody SpecializationRequest request
    ){
        return ResponseEntity.ok(specializationService.update(request));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SPECIALIZATION, " +
            "#specializationId)")
    @DeleteMapping
    public ResponseEntity<String> delete(
            @RequestParam Long specializationId
    ){
        return ResponseEntity.ok(specializationService.delete(specializationId));
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
                    "#courseId) || " +
                    "(#specializationId != null && " +
                    "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SPECIALIZATION, " +
                    "#specializationId))"
    )
    @GetMapping("/prefix")
    public ResponseEntity<String> getPrefix(
            @RequestParam(required = false) Long specializationId,
            @RequestParam Long courseId
    ) {
        return ResponseEntity.ok(specializationService.getPrefix(courseId));
    }
}
