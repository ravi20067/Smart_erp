package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionRequest;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionResponse;
import com.Smart.Erp.Modules.Academic.Services.SectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:program-coordinator|head-of-department|admin|dean|super-admin}/admin/sections")
@RequiredArgsConstructor
public class SectionController {

    private final SectionService sectionService;
    @GetMapping
    public ResponseEntity<List<SectionResponse>> getAll(){
        return ResponseEntity.ok(sectionService.getAll());
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
            "#courseId)")
    @PostMapping
    public ResponseEntity<SectionResponse> create(
            @RequestParam Long courseId,
            @RequestBody SectionRequest request
    ){
        return ResponseEntity.ok(sectionService.create(courseId,request));
    }
    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECTION, " +
            "#sectionId)")
    @PutMapping
    public ResponseEntity<SectionResponse> update(
            @RequestParam Long sectionId,
            @RequestBody SectionRequest request
    ){
        return ResponseEntity.ok(sectionService.update(sectionId,request));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECTION, " +
            "#sectionId)")
    @DeleteMapping
    public ResponseEntity<String> delete(
            @RequestParam Long sectionId
    ){
        return ResponseEntity.ok(sectionService.delete(sectionId));
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
                    "#courseId) || " +
                    "(#sectionId != null && " +
                    "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SECTION, " +
                    "#sectionId))"
    )
    @GetMapping("/prefix")
    public ResponseEntity<String> getPrefix(
            @RequestParam(required = false) Long sectionId,
            @RequestParam Long courseId
    ) {
        return ResponseEntity.ok(sectionService.getPrefix(courseId));
    }


}
