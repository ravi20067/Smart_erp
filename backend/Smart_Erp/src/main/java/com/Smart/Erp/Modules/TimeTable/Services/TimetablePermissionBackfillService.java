package com.Smart.Erp.Modules.TimeTable.Services;

import com.Smart.Erp.Modules.TimeTable.Entity.DailyTimetableOverride;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionAcademicCalendar;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableVersion;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableScope;
import com.Smart.Erp.Modules.TimeTable.Repo.DailyTimetableOverrideRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionAcademicCalendarRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionTimetableVersionRepo;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Run manually once after deploying the new ResourceType values and
 * AuthorizationService changes. It is idempotent when permission nodes
 * are already correctly linked.
 *
 * Do not expose this method as a public REST endpoint.
 */
@Service
@RequiredArgsConstructor
public class TimetablePermissionBackfillService {

    private final AuthorizationService authorizationService;
    private final SectionAcademicCalendarRepo calendarRepo;
    private final SectionTimetableVersionRepo versionRepo;
    private final DailyTimetableOverrideRepo overrideRepo;

    @Transactional
    public void backfillExistingTimetablePermissions() {

        for (SectionAcademicCalendar calendar : calendarRepo.findAll()) {
            authorizationService.createChildPermission(
                    calendar.getId(),
                    ResourceType.ACADEMIC_CALENDAR,
                    calendar.getSection().getId(),
                    ResourceType.SECTION
            );
        }

        for (SectionTimetableVersion version : versionRepo.findAll()) {
            if (version.getScope() == TimetableScope.SECTION) {
                Long sectionId = version.getSection().getId();

                authorizationService.createChildPermission(
                        sectionId,
                        ResourceType.TIMETABLE,
                        sectionId,
                        ResourceType.SECTION
                );

                authorizationService.createChildPermission(
                        version.getId(),
                        ResourceType.TIMETABLE_VERSION,
                        sectionId,
                        ResourceType.TIMETABLE
                );
            } else {
                Long groupId = version.getSectionGroup().getId();

                authorizationService.createChildPermission(
                        groupId,
                        ResourceType.GROUP_TIMETABLE,
                        groupId,
                        ResourceType.SECTION_GROUP
                );

                authorizationService.createChildPermission(
                        version.getId(),
                        ResourceType.GROUP_TIMETABLE_VERSION,
                        groupId,
                        ResourceType.GROUP_TIMETABLE
                );
            }
        }

        for (DailyTimetableOverride override : overrideRepo.findAll()) {
            if (override.getSectionGroup() == null) {
                Long sectionId = override.getSection().getId();

                authorizationService.createChildPermission(
                        sectionId,
                        ResourceType.TIMETABLE,
                        sectionId,
                        ResourceType.SECTION
                );

                authorizationService.createChildPermission(
                        override.getId(),
                        ResourceType.TIMETABLE_OVERRIDE,
                        sectionId,
                        ResourceType.TIMETABLE
                );
            } else {
                Long groupId = override.getSectionGroup().getId();

                authorizationService.createChildPermission(
                        groupId,
                        ResourceType.GROUP_TIMETABLE,
                        groupId,
                        ResourceType.SECTION_GROUP
                );

                authorizationService.createChildPermission(
                        override.getId(),
                        ResourceType.GROUP_TIMETABLE_OVERRIDE,
                        groupId,
                        ResourceType.GROUP_TIMETABLE
                );
            }
        }
    }
}
