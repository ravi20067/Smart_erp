package com.Smart.Erp.Modules.TimeTable.Controller;

import com.Smart.Erp.Modules.TimeTable.DTO.BaseTimeTableRequest;
import com.Smart.Erp.Modules.TimeTable.DTO.BaseTimeTableResponse;
import com.Smart.Erp.Modules.TimeTable.Services.TimetableManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:head-of-department|admin|dean|school-dean|super-admin}/timetable/base-templates")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN')")
public class BaseTimeTableController {

    private final TimetableManagementService management;

    @PostMapping
    @PreAuthorize(
            "hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and " +
            "@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).SCHOOL, " +
            "#r.schoolId)"
    )
    public ResponseEntity<BaseTimeTableResponse> create(
            @Valid @RequestBody BaseTimeTableRequest r
    ) {
        return ResponseEntity.ok(management.createBaseTemplate(r));
    }

    @GetMapping
    public ResponseEntity<List<BaseTimeTableResponse>> list() {
        return ResponseEntity.ok(management.getBaseTemplates());
    }

    @GetMapping("/{templateId}")
    @PreAuthorize(
            "hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and " +
            "@authVerifier.can(" +
            "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).READ, " +
            "T(com.Smart.Erp.Modules.User.Enum.ResourceType).BASE_TIMETABLE, " +
            "#templateId)"
    )
    public ResponseEntity<BaseTimeTableResponse> get(
            @PathVariable Long templateId
    ) {
        return ResponseEntity.ok(management.getBaseTemplate(templateId));
    }
}
