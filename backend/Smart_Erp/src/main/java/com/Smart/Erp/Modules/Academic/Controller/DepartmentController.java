package com.Smart.Erp.Modules.Academic.Controller;

import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.DTO.Department.DepartmentRequest;
import com.Smart.Erp.Modules.Academic.DTO.Department.DepartmentResponse;
import com.Smart.Erp.Modules.Academic.Services.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({
        "/{role:school-dean|admin|dean|super-admin}/department"
})
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> getAll(){
        return ResponseEntity.ok(departmentService.getAll());
    }
    @PostMapping
    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SCHOOL, " +
            "#schoolId)")
    public ResponseEntity<DepartmentResponse> create(
            @RequestParam Long schoolId,
            @RequestBody CommonRequest request
            ){
        return ResponseEntity.ok(departmentService.create(schoolId,request));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).DEPARTMENT, " +
            "#departmentRequest.id)")
    @PutMapping
    public ResponseEntity<DepartmentResponse> update(
            @RequestBody DepartmentRequest departmentRequest
    ){
        return ResponseEntity.ok(departmentService.update(departmentRequest));
    }

    @PreAuthorize("@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SCHOOL, " +
            "#departmentId)")
    @DeleteMapping
    public ResponseEntity<String> delete(
            @RequestParam Long departmentId
    ){
        return ResponseEntity.ok(departmentService.delete(departmentId));
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).DEPARTMENT, " +
                    "#schoolId) || " +
                    "(#schoolId != null && " +
                    "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).DEPARTMENT, " +
                    "#departmentId))"
    )
    @GetMapping("/prefix")
    public ResponseEntity<String> getPrefix(
            @RequestParam(required = false) Long departmentId,
            @RequestParam Long schoolId
    ) {
        return ResponseEntity.ok(departmentService.getPrefix(schoolId));
    }
}
