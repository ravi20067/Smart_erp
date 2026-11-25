package com.Smart.Erp.Modules.TimeTable.Controller;

import com.Smart.Erp.Modules.TimeTable.DTO.AutoGenerateTimetableRequest;
import com.Smart.Erp.Modules.TimeTable.DTO.OverrideRequest;
import com.Smart.Erp.Modules.TimeTable.DTO.OverrideResponse;
import com.Smart.Erp.Modules.TimeTable.DTO.TimetableVersionRequest;
import com.Smart.Erp.Modules.TimeTable.DTO.TimetableVersionResponse;
import com.Smart.Erp.Modules.TimeTable.DTO.TimetableView;
import com.Smart.Erp.Modules.TimeTable.Services.AutomaticTimetableGeneratorService;
import com.Smart.Erp.Modules.TimeTable.Services.TimetableManagementService;
import com.Smart.Erp.Modules.TimeTable.Services.TimetableQueryService;
import com.Smart.Erp.Modules.TimeTable.Services.TimetableResponseMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/{role:head-of-department|admin|dean|school-dean|super-admin}/timetable")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN')")
public class TimetableController {

    private final TimetableManagementService management;
    private final TimetableQueryService queries;
    private final TimetableResponseMapper mapper;
    private final AutomaticTimetableGeneratorService autoGenerator;

    @PostMapping("/auto-generate")
    @PreAuthorize("hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN')")
    public ResponseEntity<TimetableVersionResponse> autoGenerateTimetable(
            @Valid @RequestBody AutoGenerateTimetableRequest r
    ) {
        return ResponseEntity.ok(
                mapper.version(autoGenerator.generateAutomaticTimetable(r))
        );
    }

    @PostMapping("/versions")
    @PreAuthorize("hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and @timetablePermission.canCreateVersion(#r)")
    public ResponseEntity<TimetableVersionResponse> createVersion(
            @Valid @RequestBody TimetableVersionRequest r
    ) {
        return ResponseEntity.ok(
                mapper.version(management.createVersion(r))
        );
    }

    @GetMapping("/sections/{sectionId}/versions")
    @PreAuthorize("hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and @timetablePermission.canReadSectionTimetable(#sectionId)")
    public ResponseEntity<List<TimetableVersionResponse>> sectionVersions(
            @PathVariable Long sectionId
    ) {
        return ResponseEntity.ok(
                queries.sectionVersions(sectionId).stream()
                        .map(mapper::version)
                        .toList()
        );
    }

    @GetMapping("/section-groups/{groupId}/versions")
    @PreAuthorize("hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and @timetablePermission.canReadGroupTimetable(#groupId)")
    public ResponseEntity<List<TimetableVersionResponse>> groupVersions(
            @PathVariable Long groupId
    ) {
        return ResponseEntity.ok(
                queries.groupVersions(groupId).stream()
                        .map(mapper::version)
                        .toList()
        );
    }

    @PostMapping("/versions/{versionId}/publish")
    @PreAuthorize("hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and @timetablePermission.canUpdateVersion(#versionId)")
    public ResponseEntity<TimetableVersionResponse> publish(
            @PathVariable Long versionId
    ) {
        return ResponseEntity.ok(
                mapper.version(management.publishVersion(versionId, null))
        );
    }

    @PostMapping("/overrides")
    @PreAuthorize("hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and @timetablePermission.canCreateOverride(#r)")
    public ResponseEntity<OverrideResponse> submitOverride(
            @Valid @RequestBody OverrideRequest r
    ) {
        return ResponseEntity.ok(
                mapper.override(management.submitOverride(r))
        );
    }

    @PostMapping("/overrides/{overrideId}/approve")
    @PreAuthorize("hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and @timetablePermission.canUpdateOverride(#overrideId)")
    public ResponseEntity<OverrideResponse> approve(
            @PathVariable Long overrideId
    ) {
        return ResponseEntity.ok(
                mapper.override(management.decideOverride(overrideId, null, true))
        );
    }

    @PostMapping("/overrides/{overrideId}/reject")
    @PreAuthorize("hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and @timetablePermission.canUpdateOverride(#overrideId)")
    public ResponseEntity<OverrideResponse> reject(
            @PathVariable Long overrideId
    ) {
        return ResponseEntity.ok(
                mapper.override(management.decideOverride(overrideId, null, false))
        );
    }

    @GetMapping("/sections/{sectionId}/daily")
    @PreAuthorize("hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and @timetablePermission.canReadDaily(#sectionId, #sectionGroupId)")
    public ResponseEntity<TimetableView> daily(
            @PathVariable Long sectionId,
            @RequestParam(required = false) Long sectionGroupId,
            @RequestParam LocalDate date
    ) {
        return ResponseEntity.ok(
                management.getTimetable(sectionId, sectionGroupId, date)
        );
    }
}
