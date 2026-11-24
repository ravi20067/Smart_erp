package com.Smart.Erp.Modules.TimeTable.Services;

import com.Smart.Erp.Modules.TimeTable.DTO.BaseTimeTableResponse;
import com.Smart.Erp.Modules.TimeTable.DTO.CalendarDayResponse;
import com.Smart.Erp.Modules.TimeTable.DTO.CalendarResponse;
import com.Smart.Erp.Modules.TimeTable.DTO.OverrideResponse;
import com.Smart.Erp.Modules.TimeTable.DTO.TimetableVersionResponse;
import com.Smart.Erp.Modules.TimeTable.Entity.BaseTimeTable;
import com.Smart.Erp.Modules.TimeTable.Entity.DailyTimetableOverride;
import com.Smart.Erp.Modules.TimeTable.Entity.DailyTimetableOverrideDetail;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionAcademicCalendar;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionCalendarDay;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableVersion;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TimetableResponseMapper {
    public BaseTimeTableResponse base(List<PermissionAction> permissionActions, BaseTimeTable e) {
        return BaseTimeTableResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .description(e.getDescription())
                .dayStartTime(e.getDayStartTime())
                .dayEndTime(e.getDayEndTime())
                .periodsPerDay(e.getPeriodsPerDay())
                .defaultPeriodDurationMinutes(e.getDefaultPeriodDurationMinutes())
                .defaultBreakDurationMinutes(e.getDefaultBreakDurationMinutes())
                .assemblyStartTime(e.getAssemblyStartTime())
                .assemblyEndTime(e.getAssemblyEndTime())
                .active(e.getActive())
                .school(e.getSchool().toCommonDTO())
                .university(e.getSchool().getUniversity().toCommonDTO())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .createdBy(e.getCreatedBy().toCommonDTO())
                .updatedBy(e.getUpdatedBy().toCommonDTO())
                .permissionActions(permissionActions)
                .periods(e.getPeriods().stream()
                        .map(p -> BaseTimeTableResponse.PeriodResponse.builder()
                                .id(p.getId())
                                .sequenceNumber(p.getSequenceNumber())
                                .periodNumber(p.getPeriodNumber())
                                .periodType(p.getPeriodType())
                                .label(p.getLabel())
                                .startTime(p.getStartTime())
                                .endTime(p.getEndTime())
                                .durationMinutes(p.getDurationMinutes())
                                .active(p.getActive())
                                .build())
                        .toList())
                .build();
    }

    public CalendarResponse calendar(SectionAcademicCalendar e) {
        return CalendarResponse.builder()
                .id(e.getId())
                .sectionId(e.getSection().getId())
                .name(e.getName())
                .startDate(e.getStartDate())
                .endDate(e.getEndDate())
                .defaultOpeningTime(e.getDefaultOpeningTime())
                .defaultClosingTime(e.getDefaultClosingTime())
                .status(e.getStatus())
                .build();
    }

    public CalendarDayResponse day(SectionCalendarDay e) {
        return CalendarDayResponse.builder()
                .id(e.getId())
                .calendarId(e.getCalendar().getId())
                .calendarDate(e.getCalendarDate())
                .dayType(e.getDayType())
                .operatingStatus(e.getOperatingStatus())
                .title(e.getTitle())
                .description(e.getDescription())
                .holidayReason(e.getHolidayReason())
                .openingTime(e.getOpeningTime())
                .closingTime(e.getClosingTime())
                .appliedTimetableVersionId(
                        e.getAppliedTimetableVersion() == null
                                ? null
                                : e.getAppliedTimetableVersion().getId()
                )
                .instructionDay(e.getInstructionDay())
                .build();
    }

    public TimetableVersionResponse version(SectionTimetableVersion e) {
        return TimetableVersionResponse.builder()
                .id(e.getId())
                .sectionId(e.getSection() == null ? null : e.getSection().getId())
                .sectionGroupId(e.getSectionGroup() == null ? null : e.getSectionGroup().getId())
                .baseTimeTableId(e.getBaseTimeTable().getId())
                .scope(e.getScope())
                .versionNumber(e.getVersionNumber())
                .name(e.getName())
                .description(e.getDescription())
                .status(e.getStatus())
                .effectiveFrom(e.getEffectiveFrom())
                .effectiveUntil(e.getEffectiveUntil())
                .publishedAt(e.getPublishedAt())
                .entries(e.getEntries().stream()
                        .map(entry -> {
                            String teacherName = null;
                            Long teacherId = null;
                            if (entry.getTeacherEnrollment() != null && entry.getTeacherEnrollment().getTeacher() != null) {
                                teacherName = entry.getTeacherEnrollment().getTeacher().getName();
                                teacherId = entry.getTeacherEnrollment().getTeacher().getId();
                            }
                            return TimetableVersionResponse.EntryResponse.builder()
                                    .id(entry.getId())
                                    .basePeriodId(entry.getBasePeriod().getId())
                                    .subjectId(entry.getSubject().getId())
                                    .subjectName(entry.getSubject() != null ? entry.getSubject().getName() : null)
                                    .teacherEnrollmentId(entry.getTeacherEnrollment() != null ? entry.getTeacherEnrollment().getId() : null)
                                    .teacherId(teacherId)
                                    .teacherName(teacherName)
                                    .roomId(entry.getRoom() == null ? null : entry.getRoom().getId())
                                    .roomNumber(entry.getRoom() == null ? null : entry.getRoom().getRoomNumber())
                                    .dayOfWeek(entry.getDayOfWeek())
                                    .entryType(entry.getEntryType())
                                    .remarks(entry.getRemarks())
                                    .active(entry.getActive())
                                    .build();
                        })
                        .toList())
                .build();
    }

    public OverrideResponse override(DailyTimetableOverride e) {
        DailyTimetableOverrideDetail detail = e.getDetail();
        String teacherName = null;
        Long teacherId = null;
        if (detail != null && detail.getTeacherEnrollment() != null && detail.getTeacherEnrollment().getTeacher() != null) {
            teacherName = detail.getTeacherEnrollment().getTeacher().getName();
            teacherId = detail.getTeacherEnrollment().getTeacher().getId();
        }
        return OverrideResponse.builder()
                .id(e.getId())
                .sectionId(e.getSection().getId())
                .sectionGroupId(e.getSectionGroup() == null ? null : e.getSectionGroup().getId())
                .overrideDate(e.getOverrideDate())
                .action(e.getAction())
                .approvalMode(e.getApprovalMode())
                .status(e.getStatus())
                .originalEntryId(e.getOriginalEntry() == null ? null : e.getOriginalEntry().getId())
                .reason(e.getReason())
                .revisionNumber(e.getRevisionNumber())
                .approvedByUserId(e.getApprovedBy() == null ? null : e.getApprovedBy().getId())
                .approvedAt(e.getApprovedAt())
                .supersedesOverrideId(
                        e.getSupersedesOverride() == null ? null : e.getSupersedesOverride().getId()
                )
                .detail(detail == null
                        ? null
                        : OverrideResponse.DetailResponse.builder()
                                .id(detail.getId())
                                .basePeriodId(detail.getBasePeriod() == null ? null : detail.getBasePeriod().getId())
                                .subjectId(detail.getSubject() == null ? null : detail.getSubject().getId())
                                .subjectName(detail.getSubject() != null ? detail.getSubject().getName() : null)
                                .teacherEnrollmentId(
                                        detail.getTeacherEnrollment() == null
                                                ? null
                                                : detail.getTeacherEnrollment().getId()
                                )
                                .teacherId(teacherId)
                                .teacherName(teacherName)
                                .roomId(detail.getRoom() == null ? null : detail.getRoom().getId())
                                .roomNumber(detail.getRoom() != null ? detail.getRoom().getRoomNumber() : null)
                                .entryType(detail.getEntryType())
                                .remarks(detail.getRemarks())
                                .build())
                .build();
    }
}
