package com.Smart.Erp.Modules.TimeTable.Services;

import com.Smart.Erp.Modules.TimeTable.DTO.OverrideRequest;
import com.Smart.Erp.Modules.TimeTable.DTO.TimetableVersionRequest;
import com.Smart.Erp.Modules.TimeTable.Entity.DailyTimetableOverride;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionAcademicCalendar;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableVersion;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableScope;
import com.Smart.Erp.Modules.TimeTable.Repo.DailyTimetableOverrideRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionAcademicCalendarRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionTimetableVersionRepo;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component("timetablePermission")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimetablePermissionService {

    private final AuthorizationService authVerifier;
    private final SectionTimetableVersionRepo versionRepo;
    private final DailyTimetableOverrideRepo overrideRepo;
    private final SectionAcademicCalendarRepo calendarRepo;

    public boolean canCreateVersion(TimetableVersionRequest request) {
        if (request == null || request.getScope() == null
                || request.getBaseTimeTableId() == null
                || !authVerifier.can(
                        PermissionAction.READ,
                        ResourceType.BASE_TIMETABLE,
                        request.getBaseTimeTableId()
                )) {
            return false;
        }

        if (request.getScope() == TimetableScope.SECTION) {
            if (request.getSectionId() == null) {
                return false;
            }

            // TIMETABLE is the preferred permission container.
            // SECTION is retained as a fallback for existing installations
            // before the TIMETABLE root records have been backfilled.
            return authVerifier.can(
                    PermissionAction.CREATE_CHILD,
                    ResourceType.TIMETABLE,
                    request.getSectionId()
            ) || authVerifier.can(
                    PermissionAction.CREATE_CHILD,
                    ResourceType.SECTION,
                    request.getSectionId()
            );
        }

        if (request.getSectionGroupId() == null) {
            return false;
        }

        return authVerifier.can(
                PermissionAction.CREATE_CHILD,
                ResourceType.GROUP_TIMETABLE,
                request.getSectionGroupId()
        ) || authVerifier.can(
                PermissionAction.CREATE_CHILD,
                ResourceType.SECTION_GROUP,
                request.getSectionGroupId()
        );
    }

    public boolean canReadSectionTimetable(Long sectionId) {
        if (sectionId == null) {
            return false;
        }

        return authVerifier.can(
                PermissionAction.READ,
                ResourceType.TIMETABLE,
                sectionId
        ) || authVerifier.can(
                PermissionAction.READ,
                ResourceType.SECTION,
                sectionId
        );
    }

    public boolean canReadGroupTimetable(Long groupId) {
        if (groupId == null) {
            return false;
        }

        return authVerifier.can(
                PermissionAction.READ,
                ResourceType.GROUP_TIMETABLE,
                groupId
        ) || authVerifier.can(
                PermissionAction.READ,
                ResourceType.SECTION_GROUP,
                groupId
        );
    }

    public boolean canUpdateVersion(Long versionId) {
        SectionTimetableVersion version =
                versionRepo.findById(versionId).orElse(null);

        if (version == null || version.getScope() == null) {
            return false;
        }

        ResourceType type = version.getScope() == TimetableScope.SECTION
                ? ResourceType.TIMETABLE_VERSION
                : ResourceType.GROUP_TIMETABLE_VERSION;

        return authVerifier.can(
                PermissionAction.UPDATE,
                type,
                versionId
        );
    }

    public boolean canCreateOverride(OverrideRequest request) {
        if (request == null || request.getSectionId() == null) {
            return false;
        }

        if (request.getSectionGroupId() == null) {
            return authVerifier.can(
                    PermissionAction.CREATE_CHILD,
                    ResourceType.TIMETABLE,
                    request.getSectionId()
            ) || authVerifier.can(
                    PermissionAction.CREATE_CHILD,
                    ResourceType.SECTION,
                    request.getSectionId()
            );
        }

        return authVerifier.can(
                PermissionAction.CREATE_CHILD,
                ResourceType.GROUP_TIMETABLE,
                request.getSectionGroupId()
        ) || authVerifier.can(
                PermissionAction.CREATE_CHILD,
                ResourceType.SECTION_GROUP,
                request.getSectionGroupId()
        );
    }

    public boolean canUpdateOverride(Long overrideId) {
        DailyTimetableOverride override =
                overrideRepo.findById(overrideId).orElse(null);

        if (override == null) {
            return false;
        }

        ResourceType type = override.getSectionGroup() == null
                ? ResourceType.TIMETABLE_OVERRIDE
                : ResourceType.GROUP_TIMETABLE_OVERRIDE;

        return authVerifier.can(
                PermissionAction.UPDATE,
                type,
                overrideId
        );
    }

    public boolean canReadDaily(
            Long sectionId,
            Long sectionGroupId
    ) {
        if (sectionId == null) {
            return false;
        }

        if (sectionGroupId == null) {
            return canReadSectionTimetable(sectionId);
        }

        return canReadGroupTimetable(sectionGroupId)
                || canReadSectionTimetable(sectionId);
    }

    public boolean canCreateCalendar(Long sectionId) {
        return sectionId != null && authVerifier.can(
                PermissionAction.CREATE_CHILD,
                ResourceType.SECTION,
                sectionId
        );
    }

    public boolean canReadCalendar(Long calendarId) {
        return canCalendarAction(calendarId, PermissionAction.READ);
    }

    public boolean canUpdateCalendar(Long calendarId) {
        return canCalendarAction(calendarId, PermissionAction.UPDATE);
    }

    private boolean canCalendarAction(
            Long calendarId,
            PermissionAction action
    ) {
        if (calendarId == null) {
            return false;
        }

        SectionAcademicCalendar calendar =
                calendarRepo.findById(calendarId).orElse(null);

        if (calendar == null) {
            return false;
        }

        return authVerifier.can(
                action,
                ResourceType.ACADEMIC_CALENDAR,
                calendarId
        );
    }
}
