package com.Smart.Erp.Modules.TimeTable.Controller;

import com.Smart.Erp.Modules.TimeTable.DTO.CalendarDayRequest;
import com.Smart.Erp.Modules.TimeTable.DTO.CalendarDayResponse;
import com.Smart.Erp.Modules.TimeTable.DTO.CalendarRequest;
import com.Smart.Erp.Modules.TimeTable.DTO.CalendarResponse;
import com.Smart.Erp.Modules.TimeTable.Services.TimetableManagementService;
import com.Smart.Erp.Modules.TimeTable.Services.TimetablePermissionService;
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
@RequestMapping("/{role:head-of-department|admin|dean|school-dean|super-admin}/timetable/calendars")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN')")
public class SectionCalendarController {

    private final TimetableManagementService management;
    private final TimetableQueryService queries;
    private final TimetableResponseMapper mapper;

    @PostMapping
    @PreAuthorize(
            "hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and " +
            "@timetablePermission.canCreateCalendar(#r.sectionId)"
    )
    public ResponseEntity<CalendarResponse> create(
            @Valid @RequestBody CalendarRequest r
    ) {
        return ResponseEntity.ok(
                mapper.calendar(management.createCalendar(r))
        );
    }

    @GetMapping("/by-section/{sectionId}")
    @PreAuthorize(
            "hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and " +
            "@timetablePermission.canReadSectionTimetable(#sectionId)"
    )
    public ResponseEntity<CalendarResponse> getBySection(
            @PathVariable Long sectionId
    ) {
        return management.findCalendarBySection(sectionId)
                .map(cal -> ResponseEntity.ok(mapper.calendar(cal)))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/{calendarId}/publish")
    @PreAuthorize(
            "hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and " +
            "@timetablePermission.canUpdateCalendar(#calendarId)"
    )
    public ResponseEntity<CalendarResponse> publish(
            @PathVariable Long calendarId
    ) {
        return ResponseEntity.ok(
                mapper.calendar(management.publishCalendar(calendarId))
        );
    }

    @GetMapping("/{calendarId}")
    @PreAuthorize(
            "hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and " +
            "@timetablePermission.canReadCalendar(#calendarId)"
    )
    public ResponseEntity<CalendarResponse> get(
            @PathVariable Long calendarId
    ) {
        return ResponseEntity.ok(
                mapper.calendar(queries.calendar(calendarId))
        );
    }

    @GetMapping("/{calendarId}/days")
    @PreAuthorize(
            "hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and " +
            "@timetablePermission.canReadCalendar(#calendarId)"
    )
    public ResponseEntity<List<CalendarDayResponse>> days(
            @PathVariable Long calendarId,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to
    ) {
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("to must be on or after from");
        }

        return ResponseEntity.ok(
                queries.calendarDays(calendarId, from, to).stream()
                        .map(mapper::day)
                        .toList()
        );
    }

    @PutMapping("/{calendarId}/days")
    @PreAuthorize(
            "hasAnyRole('HEAD_OF_DEPARTMENT','ADMIN','DEAN','SCHOOL_DEAN','SUPER_ADMIN') and " +
            "@timetablePermission.canUpdateCalendar(#calendarId)"
    )
    public ResponseEntity<CalendarDayResponse> upsertDay(
            @PathVariable Long calendarId,
            @Valid @RequestBody CalendarDayRequest r
    ) {
        return ResponseEntity.ok(
                mapper.day(management.upsertCalendarDay(calendarId, r))
        );
    }
}
