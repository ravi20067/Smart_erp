package com.Smart.Erp.Modules.Subject.Controller;

import com.Smart.Erp.Modules.Subject.DTO.Subject.SubjectRequest;
import com.Smart.Erp.Modules.Subject.DTO.Subject.SubjectResponse;
import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Subject.Services.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:program-coordinator|head-of-department|admin|dean|super-admin}/admin/courses")
@RequiredArgsConstructor
public class SubjectController {
    private final SubjectService subjectService;

    public ResponseEntity<List<SubjectResponse>> getAll(){
        return ResponseEntity.ok(subjectService.getAll());
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
            "#courseId)")
    @PostMapping
    public ResponseEntity<SubjectResponse> create(
            @RequestParam Long courseId,
            @RequestBody CommonRequest request
            ){
        return ResponseEntity.ok(subjectService.create(courseId,request));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SUBJECT, " +
            "#subjectRequest.id)")
    @PutMapping
    public ResponseEntity<SubjectResponse> update(
            @RequestBody SubjectRequest subjectRequest
    ){
        return ResponseEntity.ok(subjectService.update(subjectRequest));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SUBJECT, " +
            "#subjectId)")
    @DeleteMapping
    public ResponseEntity<String> delete(
            @RequestParam Long subjectId
    ){
        return ResponseEntity.ok(subjectService.delete(subjectId));
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ACADEMIC_YEAR, " +
                    "#courseId) || " +
                    "(#subjectId != null && " +
                    "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
                    "#subjectId))"
    )
    @GetMapping("/prefix")
    public ResponseEntity<String> getPrefix(
            @RequestParam(required = false) Long subjectId,
            @RequestParam Long courseId
    ) {
        return ResponseEntity.ok(subjectService.getPrefix(courseId));
    }
}
