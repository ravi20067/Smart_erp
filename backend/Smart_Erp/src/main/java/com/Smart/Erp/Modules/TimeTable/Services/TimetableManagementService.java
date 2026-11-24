package com.Smart.Erp.Modules.TimeTable.Services;

import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.School;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.Subject.Services.SubjectCommonService;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.TimeTable.DTO.*;
import com.Smart.Erp.Modules.TimeTable.Entity.*;
import com.Smart.Erp.Modules.TimeTable.Enum.*;
import com.Smart.Erp.Modules.TimeTable.Repo.*;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class TimetableManagementService {
    private final BaseTimeTableRepo baseRepo;
    private final SectionAcademicCalendarRepo calendarRepo;
    private final SectionCalendarDayRepo dayRepo;
    private final SectionTimetableVersionRepo versionRepo;
    private final SectionTimetableEntryRepo entryRepo;
    private final DailyTimetableOverrideRepo overrideRepo;
    private final AcademicCommonService academic;
    private final SubjectCommonService subjects;
    private final TeacherCommonService teachers;
    private final TimeTableCommonService timeTableCommon;
    private final UserRepo userRepo;
    private final TimetableResponseMapper mapper;
    private final AuthorizationService authorizationService;

    /** Creates a reusable school-level timetable template and its ordered period rows. */
    public BaseTimeTableResponse createBaseTemplate(BaseTimeTableRequest r) {
        if (r.getDayEndTime().isBefore(r.getDayStartTime()) ||
                r.getDayEndTime().equals(r.getDayStartTime()))
            throw new IllegalArgumentException("Day end time must be after day start time.");
        long classPeriods = r.getPeriods().stream()
                .filter(p -> p.getPeriodType() == BasePeriodType.CLASS).count();
        if (classPeriods != r.getPeriodsPerDay())
            throw new IllegalArgumentException("periodsPerDay must equal the number of CLASS rows.");
        validatePeriodRows(r.getPeriods());

        School school = academic.getSchool(r.getSchoolId());
        BaseTimeTable base = BaseTimeTable.builder()
                .name(r.getName()).description(r.getDescription())
                .school(school)
                .dayStartTime(r.getDayStartTime()).dayEndTime(r.getDayEndTime())
                .periodsPerDay(r.getPeriodsPerDay())
                .defaultPeriodDurationMinutes(r.getDefaultPeriodDurationMinutes())
                .defaultBreakDurationMinutes(r.getDefaultBreakDurationMinutes())
                .assemblyStartTime(r.getAssemblyStartTime()).assemblyEndTime(r.getAssemblyEndTime())
                .active(r.getActive() == null || r.getActive()).build();


        r.getPeriods().stream()
                .sorted(Comparator.comparing(BaseTimeTableRequest.PeriodRequest::getSequenceNumber))
                .forEach(periodRequest -> base.addPeriod(
                        BaseTimeTablePeriod.builder()
                                .sequenceNumber(periodRequest.getSequenceNumber())
                                .periodNumber(periodRequest.getPeriodNumber())
                                .periodType(periodRequest.getPeriodType())
                                .label(periodRequest.getLabel())
                                .startTime(periodRequest.getStartTime())
                                .endTime(periodRequest.getEndTime())
                                .durationMinutes(periodRequest.getDurationMinutes())
                                .active(periodRequest.getActive() == null || periodRequest.getActive())
                                .build()
                ));
        BaseTimeTable savedBase = baseRepo.save(base);

        authorizationService.createChildPermission(
                savedBase.getId(),
                ResourceType.BASE_TIMETABLE,
                school.getId(),
                ResourceType.SCHOOL
        );

        return mapper.base(
                authorizationService.getPermissionAction(ResourceType.BASE_TIMETABLE, savedBase.getId()),
                savedBase
        );
    }

    private void validatePeriodRows(List<BaseTimeTableRequest.PeriodRequest> rows) {
        List<BaseTimeTableRequest.PeriodRequest> ordered = rows.stream()
                .sorted(Comparator.comparing(BaseTimeTableRequest.PeriodRequest::getSequenceNumber)).toList();
        Set<Integer> sequences = new HashSet<>(), classNumbers = new HashSet<>();
        LocalTime previousEnd = null;
        for (var p : ordered) {
            if (!sequences.add(p.getSequenceNumber()))
                throw new IllegalArgumentException("Duplicate period sequence number: " + p.getSequenceNumber());
            if (!p.getEndTime().isAfter(p.getStartTime()))
                throw new IllegalArgumentException("Period end must be after start: " + p.getLabel());
            if (previousEnd != null && p.getStartTime().isBefore(previousEnd))
                throw new IllegalArgumentException("Timetable periods overlap near: " + p.getLabel());
            if (p.getPeriodType() == BasePeriodType.CLASS) {
                if (p.getPeriodNumber() == null || !classNumbers.add(p.getPeriodNumber()))
                    throw new IllegalArgumentException("Each CLASS row needs a unique periodNumber.");
            } else if (p.getPeriodNumber() != null) {
                throw new IllegalArgumentException("Only CLASS rows may have a periodNumber.");
            }
            previousEnd = p.getEndTime();
        }
    }

    /** Creates a section calendar and materializes each date as an OPEN regular day by default. */
    public SectionAcademicCalendar createCalendar(CalendarRequest r) {
        Section section = academic.getSection(r.getSectionId());
        AcademicYear year = academic.getAcademicYear(r.getAcademicYearId());
        if (!Objects.equals(section.getAcademicYear().getId(), year.getId()))
            throw new IllegalArgumentException("The selected academic year does not belong to this section.");
        if (r.getEndDate().isBefore(r.getStartDate()))
            throw new IllegalArgumentException("Calendar endDate cannot be before startDate.");
        if (calendarRepo.findBySectionId(section.getId()).isPresent())
            throw new IllegalArgumentException("A calendar already exists for this section and academic year.");
        SectionAcademicCalendar calendar = SectionAcademicCalendar.builder()
                .name(r.getName()).section(section)
                .startDate(r.getStartDate()).endDate(r.getEndDate())
                .defaultOpeningTime(r.getDefaultOpeningTime())
                .defaultClosingTime(r.getDefaultClosingTime())
                .status(CalendarStatus.DRAFT).build();
        for (LocalDate d = r.getStartDate(); !d.isAfter(r.getEndDate()); d = d.plusDays(1)) {
            calendar.addDay(SectionCalendarDay.builder().calendarDate(d)
                    .dayType(CalendarDayType.REGULAR).operatingStatus(OperatingStatus.OPEN)
                    .instructionDay(true).build());
        }
        SectionAcademicCalendar savedCalendar = calendarRepo.save(calendar);

        authorizationService.createChildPermission(
                savedCalendar.getId(),
                ResourceType.ACADEMIC_CALENDAR,
                section.getId(),
                ResourceType.SECTION
        );

        return savedCalendar;
    }

    /** Adds or updates a date row. This allows holidays, closures, half days and date-specific versions. */
    public SectionCalendarDay upsertCalendarDay(Long calendarId, CalendarDayRequest r) {
        SectionAcademicCalendar calendar = require(calendarRepo.findById(calendarId), "Calendar", calendarId);
        if (r.getCalendarDate().isBefore(calendar.getStartDate()) ||
                r.getCalendarDate().isAfter(calendar.getEndDate()))
            throw new IllegalArgumentException("Date must be inside the calendar range.");
        if (r.getClosingTime() != null && r.getOpeningTime() != null &&
                !r.getClosingTime().isAfter(r.getOpeningTime()))
            throw new IllegalArgumentException("Closing time must be after opening time.");
        SectionCalendarDay day = dayRepo.findByCalendarIdAndCalendarDate(calendarId, r.getCalendarDate())
                .orElseGet(() -> SectionCalendarDay.builder().calendar(calendar)
                        .calendarDate(r.getCalendarDate()).build());
        day.setDayType(r.getDayType()); day.setOperatingStatus(r.getOperatingStatus());
        day.setTitle(r.getTitle()); day.setDescription(r.getDescription());
        day.setHolidayReason(r.getHolidayReason()); day.setOpeningTime(r.getOpeningTime());
        day.setClosingTime(r.getClosingTime());
        day.setInstructionDay(r.getInstructionDay() == null || r.getInstructionDay());
        if (r.getAppliedTimetableVersionId() != null) {
            SectionTimetableVersion v = require(versionRepo.findById(r.getAppliedTimetableVersionId()),
                    "Timetable version", r.getAppliedTimetableVersionId());
            if (!Objects.equals(v.getSection() == null ? null : v.getSection().getId(), calendar.getSection().getId()) &&
                    !Objects.equals(v.getSectionGroup() == null ? null : v.getSectionGroup().getSection().getId(), calendar.getSection().getId()))
                throw new IllegalArgumentException("The selected timetable version belongs to another section.");
            day.setAppliedTimetableVersion(v);
        } else day.setAppliedTimetableVersion(null);
        return dayRepo.save(day);
    }

    /** Creates a draft timetable version; publishing is a separate deliberate action. */
    public SectionTimetableVersion createVersion(TimetableVersionRequest r) {
        if (r.getEffectiveUntil() != null && r.getEffectiveUntil().isBefore(r.getEffectiveFrom()))
            throw new IllegalArgumentException("effectiveUntil cannot be before effectiveFrom.");
        Section section;
        SectionGroup group = null;
        if (r.getScope() == TimetableScope.SECTION) {
            if (r.getSectionId() == null || r.getSectionGroupId() != null)
                throw new IllegalArgumentException("SECTION scope requires sectionId and no sectionGroupId.");
            section = academic.getSection(r.getSectionId());
        } else {
            if (r.getSectionGroupId() == null || r.getSectionId() != null)
                throw new IllegalArgumentException("SECTION_GROUP scope requires sectionGroupId and no sectionId.");
            group = academic.getSectionGroup(r.getSectionGroupId());
            section = group.getSection();
        }
        // Ensure the permission-container node exists for legacy sections/groups.
        // The parent SECTION / SECTION_GROUP permission records must already exist.
        if (r.getScope() == TimetableScope.SECTION) {
            ensureSectionTimetablePermissionRoot(section.getId());
        } else {
            ensureGroupTimetablePermissionRoot(group.getId());
        }

        BaseTimeTable base = require(baseRepo.findById(r.getBaseTimeTableId()), "Base timetable", r.getBaseTimeTableId());
        int next = r.getScope() == TimetableScope.SECTION
                ? versionRepo.findBySectionIdOrderByVersionNumberDesc(section.getId()).stream()
                    .filter(v -> v.getScope() == TimetableScope.SECTION).mapToInt(SectionTimetableVersion::getVersionNumber).max().orElse(0) + 1
                : versionRepo.findBySectionGroupIdOrderByVersionNumberDesc(group.getId()).stream()
                    .mapToInt(SectionTimetableVersion::getVersionNumber).max().orElse(0) + 1;
        SectionTimetableVersion version = SectionTimetableVersion.builder()
                .scope(r.getScope()).section(section)
                .sectionGroup(group).baseTimeTable(base).versionNumber(next)
                .name(r.getName()).description(r.getDescription())
                .status(TimetableVersionStatus.DRAFT).effectiveFrom(r.getEffectiveFrom())
                .effectiveUntil(r.getEffectiveUntil()).build();
        if (r.getEntries() != null) for (var e : r.getEntries()) {
            BaseTimeTablePeriod period = require(basePeriod(e.getBasePeriodId()), "Base period", e.getBasePeriodId());
            if (!Objects.equals(period.getBaseTimeTable().getId(), base.getId()))
                throw new IllegalArgumentException("Entry period must belong to the selected base timetable.");
            version.addEntry(SectionTimetableEntry.builder().dayOfWeek(e.getDayOfWeek())
                    .basePeriod(period).subject(subjects.getSubject(e.getSubjectId()))
                    .teacherEnrollment(teachers.getTeacherEnrollment(e.getTeacherEnrollmentId()))
                    .room(e.getRoomId() == null ? null : timeTableCommon.getRoom(e.getRoomId()))
                    .entryType(e.getEntryType()).remarks(e.getRemarks()).active(true).build());
        }
        validateNoDuplicateSlots(version);
        SectionTimetableVersion savedVersion = versionRepo.save(version);

        if (savedVersion.getScope() == TimetableScope.SECTION) {
            authorizationService.createChildPermission(
                    savedVersion.getId(),
                    ResourceType.TIMETABLE_VERSION,
                    savedVersion.getSection().getId(),
                    ResourceType.TIMETABLE
            );
        } else {
            authorizationService.createChildPermission(
                    savedVersion.getId(),
                    ResourceType.GROUP_TIMETABLE_VERSION,
                    savedVersion.getSectionGroup().getId(),
                    ResourceType.GROUP_TIMETABLE
            );
        }

        return savedVersion;
    }

    private Optional<BaseTimeTablePeriod> basePeriod(Long id) {
        return basePeriodRepo.findById(id);
    }
    private final BaseTimeTablePeriodRepo basePeriodRepo;

    private void validateNoDuplicateSlots(SectionTimetableVersion v) {
        Set<String> keys = new HashSet<>();
        for (SectionTimetableEntry e : v.getEntries()) {
            String key = e.getDayOfWeek() + ":" + e.getBasePeriod().getId();
            if (!keys.add(key)) throw new IllegalArgumentException("Duplicate day/period slot: " + key);
        }
    }

    /** Publishes a draft. Existing published version is closed the day before this version starts. */
    public SectionTimetableVersion publishVersion(Long versionId, Long publishedByUserId) {
        SectionTimetableVersion v = require(versionRepo.findById(versionId), "Timetable version", versionId);
        if (v.getStatus() != TimetableVersionStatus.DRAFT)
            throw new IllegalArgumentException("Only DRAFT versions can be published.");
        List<SectionTimetableVersion> previous = v.getScope() == TimetableScope.SECTION
                ? versionRepo.findBySectionIdOrderByVersionNumberDesc(v.getSection().getId())
                : versionRepo.findBySectionGroupIdOrderByVersionNumberDesc(v.getSectionGroup().getId());
        for (SectionTimetableVersion old : previous) {
            if (old.getId().equals(v.getId()) || old.getStatus() != TimetableVersionStatus.PUBLISHED) continue;
            boolean sameScope = old.getScope() == v.getScope();
            if (!sameScope) continue;
            if (old.getEffectiveFrom().isBefore(v.getEffectiveFrom()) &&
                    (old.getEffectiveUntil() == null || old.getEffectiveUntil().isAfter(v.getEffectiveFrom().minusDays(1)))) {
                old.setEffectiveUntil(v.getEffectiveFrom().minusDays(1));
                if (old.getEffectiveUntil().isBefore(old.getEffectiveFrom()))
                    throw new IllegalArgumentException("New version overlaps an existing published version.");
            } else if (rangesOverlap(old.getEffectiveFrom(), old.getEffectiveUntil(), v.getEffectiveFrom(), v.getEffectiveUntil())) {
                throw new IllegalArgumentException("Published timetable versions cannot have overlapping effective dates.");
            }
            if (old.getEffectiveUntil() != null && old.getEffectiveUntil().isBefore(LocalDate.now()))
                old.setStatus(TimetableVersionStatus.SUPERSEDED);
        }
        v.setStatus(TimetableVersionStatus.PUBLISHED);
        v.setPublishedAt(Instant.now());
        User publisher = publishedByUserId != null
                ? require(userRepo.findById(publishedByUserId), "User", publishedByUserId)
                : authorizationService.getCurrentUser();

        if (publisher != null) {
            v.setPublishedBy(publisher);
        }

        return versionRepo.save(v);
    }

    private boolean rangesOverlap(LocalDate a1, LocalDate a2, LocalDate b1, LocalDate b2) {
        LocalDate endA = a2 == null ? LocalDate.MAX : a2;
        LocalDate endB = b2 == null ? LocalDate.MAX : b2;
        return !a1.isAfter(endB) && !b1.isAfter(endA);
    }

    /** Submits a one-day change. Approval mode controls whether it is immediately effective. */
    public DailyTimetableOverride submitOverride(OverrideRequest r) {
        Section section = academic.getSection(r.getSectionId());
        SectionGroup group = r.getSectionGroupId() == null ? null : academic.getSectionGroup(r.getSectionGroupId());
        if (group != null && !Objects.equals(group.getSection().getId(), section.getId()))
            throw new IllegalArgumentException("Section group does not belong to the supplied section.");

        if (group == null) {
            ensureSectionTimetablePermissionRoot(section.getId());
        } else {
            ensureGroupTimetablePermissionRoot(group.getId());
        }

        SectionTimetableEntry original = r.getOriginalEntryId() == null ? null :
                require(entryRepo.findById(r.getOriginalEntryId()), "Timetable entry", r.getOriginalEntryId());
        if ((r.getAction() == OverrideAction.REPLACE || r.getAction() == OverrideAction.CANCEL) && original == null)
            throw new IllegalArgumentException("REPLACE/CANCEL requires originalEntryId.");

        if (original != null) {
            SectionTimetableVersion originalVersion = original.getTimetableVersion();

            Long originalSectionId = originalVersion == null
                    ? null
                    : originalVersion.getSection() != null
                        ? originalVersion.getSection().getId()
                        : originalVersion.getSectionGroup() != null
                            && originalVersion.getSectionGroup().getSection() != null
                                ? originalVersion.getSectionGroup().getSection().getId()
                                : null;

            if (originalVersion == null
                    || !Objects.equals(originalSectionId, section.getId())) {
                throw new IllegalArgumentException(
                        "The original timetable entry does not belong to the supplied section."
                );
            }

            if (group == null && originalVersion.getScope() != TimetableScope.SECTION) {
                throw new IllegalArgumentException(
                        "A section-level override must target a section-level timetable entry."
                );
            }

            if (group != null
                    && originalVersion.getScope() == TimetableScope.SECTION_GROUP
                    && (originalVersion.getSectionGroup() == null
                    || !Objects.equals(originalVersion.getSectionGroup().getId(), group.getId()))) {
                throw new IllegalArgumentException(
                        "The original timetable entry belongs to another section group."
                );
            }

            if (!Boolean.TRUE.equals(original.getActive())) {
                throw new IllegalArgumentException(
                        "An inactive timetable entry cannot be overridden."
                );
            }

            WeekDay requestedDay = WeekDay.valueOf(
                    r.getOverrideDate().getDayOfWeek().name()
            );

            if (original.getDayOfWeek() != requestedDay) {
                throw new IllegalArgumentException(
                        "The original timetable entry does not belong to the override date's weekday."
                );
            }
        }
        if (r.getAction() == OverrideAction.ADD && original != null)
            throw new IllegalArgumentException("ADD must not contain originalEntryId.");
        DailyTimetableOverride override = DailyTimetableOverride.builder()
                .section(section).sectionGroup(group).overrideDate(r.getOverrideDate())
                .action(r.getAction()).approvalMode(r.getApprovalMode())
                .status(r.getApprovalMode() == OverrideApprovalMode.IMMEDIATE ? OverrideStatus.APPROVED : OverrideStatus.PENDING)
                .originalEntry(original).reason(r.getReason()).revisionNumber(1).build();

        if (r.getApprovalMode() == OverrideApprovalMode.IMMEDIATE) {
            override.setApprovedAt(Instant.now());
            override.setApprovedBy(authorizationService.getCurrentUser());
        }
        if (r.getAction() != OverrideAction.CANCEL) {
            if (r.getBasePeriodId() == null || r.getSubjectId() == null || r.getTeacherEnrollmentId() == null || r.getEntryType() == null)
                throw new IllegalArgumentException("ADD/REPLACE requires period, subject, teacher enrollment and entry type.");
            DailyTimetableOverrideDetail detail = DailyTimetableOverrideDetail.builder()
                    .basePeriod(require(basePeriod(r.getBasePeriodId()), "Base period", r.getBasePeriodId()))
                    .subject(subjects.getSubject(r.getSubjectId()))
                    .teacherEnrollment(teachers.getTeacherEnrollment(r.getTeacherEnrollmentId()))
                    .room(r.getRoomId() == null ? null : timeTableCommon.getRoom(r.getRoomId()))
                    .entryType(r.getEntryType()).remarks(r.getRemarks()).build();
            override.setDetail(detail);
        }
        DailyTimetableOverride savedOverride = overrideRepo.save(override);

        if (savedOverride.getSectionGroup() == null) {
            authorizationService.createChildPermission(
                    savedOverride.getId(),
                    ResourceType.TIMETABLE_OVERRIDE,
                    savedOverride.getSection().getId(),
                    ResourceType.TIMETABLE
            );
        } else {
            authorizationService.createChildPermission(
                    savedOverride.getId(),
                    ResourceType.GROUP_TIMETABLE_OVERRIDE,
                    savedOverride.getSectionGroup().getId(),
                    ResourceType.GROUP_TIMETABLE
            );
        }

        return savedOverride;
    }

    /** Only an authorized controller caller should be allowed to invoke this approval operation. */
    public DailyTimetableOverride decideOverride(Long overrideId, Long userId, boolean approve) {
        DailyTimetableOverride o = require(overrideRepo.findById(overrideId), "Override", overrideId);
        if (o.getStatus() != OverrideStatus.PENDING)
            throw new IllegalArgumentException("Only PENDING overrides can be approved or rejected.");
        o.setStatus(approve ? OverrideStatus.APPROVED : OverrideStatus.REJECTED);
        o.setApprovedAt(Instant.now());
        User decisionMaker = userId != null
                ? require(userRepo.findById(userId), "User", userId)
                : authorizationService.getCurrentUser();

        if (decisionMaker != null) {
            // The current entity has approvedBy for both approval and rejection.
            // Consider renaming it to decidedBy in a future schema migration.
            o.setApprovedBy(decisionMaker);
        }

        return overrideRepo.save(o);
    }

    /** Resolves a calendar day, the applicable version and approved one-day changes. */
    public TimetableView getTimetable(Long sectionId, Long groupId, LocalDate date) {
        Section section = academic.getSection(sectionId);
        SectionGroup group = groupId == null ? null : academic.getSectionGroup(groupId);
        if (group != null && !Objects.equals(group.getSection().getId(), section.getId()))
            throw new IllegalArgumentException("Section group does not belong to the supplied section.");
        SectionAcademicCalendar calendar = calendarRepo.findBySectionId(
                sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Academic calendar not found for section " + sectionId));
        SectionCalendarDay day = dayRepo.findByCalendarIdAndCalendarDate(calendar.getId(), date)
                .orElseThrow(() -> new ResourceNotFoundException("Calendar day not configured: " + date));
        if (day.getOperatingStatus() == OperatingStatus.CLOSED || !Boolean.TRUE.equals(day.getInstructionDay()))
            return TimetableView.builder().date(date).open(false).dayTitle(day.getTitle())
                    .closureReason(day.getHolidayReason() != null ? day.getHolidayReason() : day.getDescription())
                    .slots(List.of()).build();

        SectionTimetableVersion v = day.getAppliedTimetableVersion();
        if (v == null) v = resolveVersion(sectionId, groupId, date);
        if (v == null) throw new ResourceNotFoundException("No published timetable version applies on " + date);
        List<SectionTimetableEntry> entries = entryRepo.findByTimetableVersionIdAndDayOfWeekAndActiveTrueOrderByBasePeriod_SequenceNumber(
                v.getId(), WeekDay.valueOf(date.getDayOfWeek().name()));
        List<DailyTimetableOverride> changes = new ArrayList<>(overrideRepo.findBySectionIdAndOverrideDateAndStatus(sectionId, date, OverrideStatus.APPROVED));
        if (groupId != null) changes.addAll(overrideRepo.findBySectionGroupIdAndOverrideDateAndStatus(groupId, date, OverrideStatus.APPROVED));
        Set<Long> cancelledOrReplaced = new HashSet<>();
        for (DailyTimetableOverride o : changes)
            if (o.getOriginalEntry() != null) cancelledOrReplaced.add(o.getOriginalEntry().getId());

        List<TimetableView.Slot> slots = new ArrayList<>();
        for (SectionTimetableEntry e : entries) {
            if (cancelledOrReplaced.contains(e.getId())) continue;
            slots.add(TimetableView.Slot.builder().entryId(e.getId())
                    .sequenceNumber(e.getBasePeriod().getSequenceNumber())
                    .periodNumber(e.getBasePeriod().getPeriodNumber())
                    .periodLabel(e.getBasePeriod().getLabel())
                    .startTime(e.getBasePeriod().getStartTime()).endTime(e.getBasePeriod().getEndTime())
                    .subject(e.getSubject().getName()).teacher(String.valueOf(e.getTeacherEnrollment().getId()))
                    .room(e.getRoom() == null ? null : e.getRoom().getRoomNumber())
                    .entryType(e.getEntryType()).note(e.getRemarks()).overridden(false).build());
        }
        for (DailyTimetableOverride o : changes) {
            if (o.getAction() == OverrideAction.CANCEL || o.getDetail() == null) continue;
            DailyTimetableOverrideDetail d = o.getDetail();
            BaseTimeTablePeriod p = d.getBasePeriod();
            slots.add(TimetableView.Slot.builder().entryId(o.getId())
                    .sequenceNumber(p.getSequenceNumber()).periodNumber(p.getPeriodNumber())
                    .periodLabel(p.getLabel()).startTime(p.getStartTime()).endTime(p.getEndTime())
                    .subject(d.getSubject().getName()).teacher(String.valueOf(d.getTeacherEnrollment().getId()))
                    .room(d.getRoom() == null ? null : d.getRoom().getRoomNumber())
                    .entryType(d.getEntryType()).note(d.getRemarks()).overridden(true).build());
        }
        slots.sort(Comparator.comparing(TimetableView.Slot::getSequenceNumber));
        return TimetableView.builder().date(date).open(true).dayTitle(day.getTitle())
                .timetableVersionId(v.getId()).versionNumber(v.getVersionNumber())
                .versionName(v.getName()).slots(slots).build();
    }

    private SectionTimetableVersion resolveVersion(Long sectionId, Long groupId, LocalDate date) {
        // A group-specific version takes precedence; otherwise the section version is inherited.
        if (groupId != null) {
            List<SectionTimetableVersion> groupVersions = versionRepo.findBySectionGroupIdOrderByVersionNumberDesc(groupId);
            Optional<SectionTimetableVersion> selected = groupVersions.stream()
                    .filter(v -> v.getStatus() == TimetableVersionStatus.PUBLISHED)
                    .filter(v -> !v.getEffectiveFrom().isAfter(date))
                    .filter(v -> v.getEffectiveUntil() == null || !v.getEffectiveUntil().isBefore(date))
                    .max(Comparator.comparing(SectionTimetableVersion::getEffectiveFrom));
            if (selected.isPresent()) return selected.get();
        }
        return versionRepo.findBySectionIdOrderByVersionNumberDesc(sectionId).stream()
                .filter(v -> v.getStatus() == TimetableVersionStatus.PUBLISHED)
                .filter(v -> v.getScope() == TimetableScope.SECTION)
                .filter(v -> !v.getEffectiveFrom().isAfter(date))
                .filter(v -> v.getEffectiveUntil() == null || !v.getEffectiveUntil().isBefore(date))
                .max(Comparator.comparing(SectionTimetableVersion::getEffectiveFrom)).orElse(null);
    }

    private void ensureSectionTimetablePermissionRoot(Long sectionId) {
        authorizationService.createChildPermission(
                sectionId,
                ResourceType.TIMETABLE,
                sectionId,
                ResourceType.SECTION
        );
    }

    private void ensureGroupTimetablePermissionRoot(Long sectionGroupId) {
        authorizationService.createChildPermission(
                sectionGroupId,
                ResourceType.GROUP_TIMETABLE,
                sectionGroupId,
                ResourceType.SECTION_GROUP
        );
    }

    private <T> T require(Optional<T> value, String label, Long id) {
        return value.orElseThrow(() -> new ResourceNotFoundException(label + " not found with id: " + id));
    }

    public List<BaseTimeTableResponse> getBaseTemplate() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.BASE_TIMETABLE);
        List<BaseTimeTable> baseTimeTables = baseRepo.findAllById(map.keySet());

        return baseTimeTables.stream()
                .filter(baseTemplate -> map.getOrDefault(
                        baseTemplate.getId(), Collections.emptyList()
                ).contains(PermissionAction.READ))
                .map(baseTemplate -> mapper.base(map.get(baseTemplate.getId()), baseTemplate))
                .toList();
    }

    public List<BaseTimeTableResponse> getBaseTemplates() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.BASE_TIMETABLE);
        List<BaseTimeTable> baseTimeTables = baseRepo.findAllByIdInOrderByNameAsc(new ArrayList<>(map.keySet()));

        return baseTimeTables.stream()
                .filter(baseTemplate -> map.getOrDefault(
                        baseTemplate.getId(), Collections.emptyList()
                ).contains(PermissionAction.READ))
                .map(baseTemplate -> mapper.base(map.get(baseTemplate.getId()), baseTemplate))
                .toList();
    }

    public BaseTimeTableResponse getBaseTemplate(Long templateId) {
        BaseTimeTable baseTimeTable = require(
                baseRepo.findById(templateId),
                "Base timetable",
                templateId
        );
        List<PermissionAction> permissionActions =
                authorizationService.getPermissionAction(ResourceType.BASE_TIMETABLE, templateId);
        return mapper.base(permissionActions, baseTimeTable);
    }
}
