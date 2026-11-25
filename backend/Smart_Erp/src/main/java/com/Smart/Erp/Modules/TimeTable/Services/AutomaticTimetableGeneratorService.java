package com.Smart.Erp.Modules.TimeTable.Services;

import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Subject.Repo.SubjectRepo;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.TimeTable.DTO.AutoGenerateTimetableRequest;
import com.Smart.Erp.Modules.TimeTable.Entity.*;
import com.Smart.Erp.Modules.TimeTable.Enum.*;
import com.Smart.Erp.Modules.TimeTable.Repo.*;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AutomaticTimetableGeneratorService {

    private final BaseTimeTableRepo baseRepo;
    private final SectionTimetableVersionRepo versionRepo;
    private final SectionTimetableEntryRepo entryRepo;
    private final RoomRepo roomRepo;
    private final SubjectRepo subjectRepo;
    private final AcademicCommonService academic;
    private final AuthorizationService authorizationService;
    private final TimetableManagementService managementService;

    private static final List<WeekDay> PRIMARY_DAYS = List.of(
            WeekDay.MONDAY,
            WeekDay.TUESDAY,
            WeekDay.WEDNESDAY,
            WeekDay.THURSDAY,
            WeekDay.FRIDAY
    );

    private static final List<WeekDay> EXTENDED_DAYS = List.of(
            WeekDay.MONDAY,
            WeekDay.TUESDAY,
            WeekDay.WEDNESDAY,
            WeekDay.THURSDAY,
            WeekDay.FRIDAY,
            WeekDay.SATURDAY
    );

    public SectionTimetableVersion generateAutomaticTimetable(AutoGenerateTimetableRequest r) {
        Section section = academic.getSection(r.getSectionId());
        SectionGroup group = null;
        TimetableScope scope = r.getScope();

        if (r.getSectionGroupId() != null) {
            group = academic.getSectionGroup(r.getSectionGroupId());
            if (group.getSection() == null || !Objects.equals(group.getSection().getId(), section.getId())) {
                throw new IllegalArgumentException("Selected SectionGroup does not belong to Section '" + section.getName() + "'.");
            }
            scope = TimetableScope.SECTION_GROUP;
        } else if (scope == null) {
            scope = TimetableScope.SECTION;
        }

        BaseTimeTable base = baseRepo.findById(r.getBaseTimeTableId())
                .orElseThrow(() -> new IllegalArgumentException("Base timetable not found with ID: " + r.getBaseTimeTableId()));

        // Keep the full ordered timeline so we never pair a period across a BREAK, LUNCH, or ASSEMBLY!
        List<BaseTimeTablePeriod> allActivePeriods = base.getPeriods().stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()))
                .sorted(Comparator.comparing(BaseTimeTablePeriod::getSequenceNumber))
                .toList();

        List<BaseTimeTablePeriod> classPeriods = allActivePeriods.stream()
                .filter(p -> p.getPeriodType() == BasePeriodType.CLASS)
                .toList();

        if (classPeriods.isEmpty()) {
            throw new IllegalStateException("Base timetable has no active CLASS periods configured.");
        }

        // Precompute genuinely contiguous class period pairs (sequenceNumber + 1 with NO break/lunch between them)
        List<BaseTimeTablePeriod[]> contiguousClassPairs = new ArrayList<>();
        for (int i = 0; i < allActivePeriods.size() - 1; i++) {
            BaseTimeTablePeriod p1 = allActivePeriods.get(i);
            BaseTimeTablePeriod p2 = allActivePeriods.get(i + 1);
            if (p1.getPeriodType() == BasePeriodType.CLASS
                    && p2.getPeriodType() == BasePeriodType.CLASS
                    && Objects.equals(p2.getSequenceNumber(), p1.getSequenceNumber() + 1)) {
                contiguousClassPairs.add(new BaseTimeTablePeriod[]{p1, p2});
            }
        }

        // 1. Resolve eligible subjects strictly based on Specialization Scope (NO cross-scope fallback!)
        List<Subject> allCourseSubjects = subjectRepo.findByCourse_Id(section.getCourse().getId()).stream()
                .filter(s -> s.getActiveStatus() == null || s.getActiveStatus() == ActiveStatus.ENABLE)
                .toList();
        List<Subject> eligibleSubjects;

        if (scope == TimetableScope.SECTION_GROUP) {
            if (group == null || group.getSpecialization() == null) {
                throw new IllegalArgumentException("SECTION_GROUP scope requires a SectionGroup associated with a Specialization.");
            }
            final Long specId = group.getSpecialization().getId();
            eligibleSubjects = allCourseSubjects.stream()
                    .filter(s -> s.getSpecializations() != null
                            && s.getSpecializations().stream().anyMatch(sp -> Objects.equals(sp.getId(), specId)))
                    .collect(Collectors.toList());
            if (eligibleSubjects.isEmpty()) {
                throw new IllegalStateException(
                        "No specialization subjects found for specialization '" + group.getSpecialization().getName() +
                        "'. Specialization subjects are scheduled under SECTION_GROUP scope."
                );
            }
        } else {
            // SECTION scope: strictly common/core subjects (subjects with NO specializations)
            eligibleSubjects = allCourseSubjects.stream()
                    .filter(s -> s.getSpecializations() == null || s.getSpecializations().isEmpty())
                    .collect(Collectors.toList());
            if (eligibleSubjects.isEmpty()) {
                throw new IllegalStateException(
                        "No core subjects (without specialization) found for course '" + section.getCourse().getName() +
                        "'. Specialization subjects must be scheduled under their respective SECTION_GROUP."
                );
            }
        }

        // 2. Assign strictly ONE single active teacher per subject within this section/group timetable
        Map<Subject, TeacherEnrollment> subjectTeacherMap = new LinkedHashMap<>();
        Map<Long, Integer> teacherWeeklyLoad = new HashMap<>();
        for (Subject subject : eligibleSubjects) {
            if (subject.getSubjectTeachers() != null && !subject.getSubjectTeachers().isEmpty()) {
                // Prefer active enrollments sorted consistently (and balancing load if multiple teachers exist)
                TeacherEnrollment primaryEnrollment = subject.getSubjectTeachers().stream()
                        .filter(Objects::nonNull)
                        .filter(te -> te.getTeacher() != null)
                        .filter(te -> te.getStatus() == null || te.getStatus() == EnrollmentStatus.ACTIVE)
                        .min(Comparator.comparingInt((TeacherEnrollment te) -> teacherWeeklyLoad.getOrDefault(te.getTeacher().getId(), 0))
                                .thenComparing(TeacherEnrollment::getId))
                        .orElse(null);

                if (primaryEnrollment != null) {
                    subjectTeacherMap.put(subject, primaryEnrollment);
                    Long tid = primaryEnrollment.getTeacher().getId();
                    int estLectures = isPractical(subject) ? 2 : (subject.getLecturesPerWeek() != null ? subject.getLecturesPerWeek() : 3);
                    teacherWeeklyLoad.put(tid, teacherWeeklyLoad.getOrDefault(tid, 0) + estLectures);
                }
            } else {
                log.warn("Subject {} ({}) has no assigned teacher enrollment; skipping in automatic generator",
                        subject.getName(), subject.getCode());
            }
        }

        if (subjectTeacherMap.isEmpty()) {
            throw new IllegalStateException(
                    "None of the eligible subjects have active assigned teachers. Assign faculty to subjects under Lecture Allocation first."
            );
        }

        // 3. Room assignment pool
        List<Room> availableRooms = r.getPreferredRoomIds() != null && !r.getPreferredRoomIds().isEmpty()
                ? roomRepo.findAllById(r.getPreferredRoomIds())
                : roomRepo.findAll();

        // 4. Prevent collision between SECTION timetable & its SECTION_GROUP specialization timetables
        Set<String> occupiedSlots = new HashSet<>();
        preloadComplementarySectionSlots(section.getId(), scope, group != null ? group.getId() : null, occupiedSlots);

        Set<String> teacherInternalBusySlots = new HashSet<>(); // key: teacherId:day:periodId
        List<SectionTimetableEntry> entries = new ArrayList<>();
        Map<WeekDay, Integer> dayLoadMap = new EnumMap<>(WeekDay.class);
        for (WeekDay d : EXTENDED_DAYS) dayLoadMap.put(d, 0);

        // Compute next version number
        int nextVersion;
        if (scope == TimetableScope.SECTION) {
            nextVersion = versionRepo.findBySectionIdOrderByVersionNumberDesc(section.getId()).stream()
                    .filter(v -> v.getScope() == TimetableScope.SECTION)
                    .mapToInt(SectionTimetableVersion::getVersionNumber)
                    .max().orElse(0) + 1;
        } else {
            nextVersion = versionRepo.findBySectionGroupIdOrderByVersionNumberDesc(group.getId()).stream()
                    .mapToInt(SectionTimetableVersion::getVersionNumber)
                    .max().orElse(0) + 1;
        }

        String versionName = r.getName() != null && !r.getName().isBlank()
                ? r.getName()
                : (scope == TimetableScope.SECTION ? section.getName() : group.getName()) + " Auto-Generated Timetable v" + nextVersion;

        SectionTimetableVersion version = SectionTimetableVersion.builder()
                .scope(scope)
                .section(section)
                .sectionGroup(group)
                .baseTimeTable(base)
                .versionNumber(nextVersion)
                .name(versionName)
                .description(r.getDescription() != null
                        ? r.getDescription()
                        : "Conflict-free schedule auto-generated with teacher availability, specialization scope & double-period lab enforcement.")
                .status(TimetableVersionStatus.DRAFT)
                .effectiveFrom(r.getEffectiveFrom())
                .effectiveUntil(r.getEffectiveUntil())
                .build();

        // 5. Schedule Practical / Lab subjects FIRST as 2 truly consecutive class periods (not separated by break/lunch)
        List<Subject> practicalSubjects = subjectTeacherMap.keySet().stream()
                .filter(this::isPractical)
                .toList();

        for (Subject subject : practicalSubjects) {
            TeacherEnrollment enrollment = subjectTeacherMap.get(subject);
            Teacher teacher = enrollment.getTeacher();
            int labBlocksNeeded = computePracticalBlocksNeeded(subject);
            int scheduledBlocks = 0;

            List<WeekDay> orderedDays = sortedDaysByLoad(PRIMARY_DAYS, dayLoadMap);
            for (WeekDay day : orderedDays) {
                if (scheduledBlocks >= labBlocksNeeded) break;

                for (BaseTimeTablePeriod[] pair : contiguousClassPairs) {
                    BaseTimeTablePeriod p1 = pair[0];
                    BaseTimeTablePeriod p2 = pair[1];
                    String slotKey1 = day + ":" + p1.getId();
                    String slotKey2 = day + ":" + p2.getId();

                    if (!occupiedSlots.contains(slotKey1) && !occupiedSlots.contains(slotKey2)
                            && isTeacherAvailable(teacher, day, p1.getId(), teacherInternalBusySlots)
                            && isTeacherAvailable(teacher, day, p2.getId(), teacherInternalBusySlots)) {

                        Room room = findFreeRoomForConsecutive(availableRooms, day, p1, p2, entries, true);

                        entries.add(buildEntry(version, day, p1, subject, enrollment, room,
                                TimetableEntryType.PRACTICAL, "Lab Session (Period 1 of 2)"));
                        entries.add(buildEntry(version, day, p2, subject, enrollment, room,
                                TimetableEntryType.PRACTICAL, "Lab Session (Period 2 of 2)"));

                        occupiedSlots.add(slotKey1);
                        occupiedSlots.add(slotKey2);
                        teacherInternalBusySlots.add(teacher.getId() + ":" + slotKey1);
                        teacherInternalBusySlots.add(teacher.getId() + ":" + slotKey2);
                        dayLoadMap.put(day, dayLoadMap.get(day) + 2);
                        scheduledBlocks++;
                        break; // max 1 double-period block of this lab per day
                    }
                }
            }
        }

        // 6. Schedule Theory subjects cleanly across balanced days (1 single teacher per subject in section)
        List<Subject> theorySubjects = subjectTeacherMap.keySet().stream()
                .filter(s -> !isPractical(s))
                .toList();

        for (Subject subject : theorySubjects) {
            TeacherEnrollment enrollment = subjectTeacherMap.get(subject);
            Teacher teacher = enrollment.getTeacher();
            int targetLectures = subject.getLecturesPerWeek() != null && subject.getLecturesPerWeek() > 0
                    ? Math.min(subject.getLecturesPerWeek(), 6)
                    : 3;
            int scheduledCount = 0;

            // Pass 1: Spread 1 lecture per day across least-loaded primary weekdays
            List<WeekDay> candidateDays = targetLectures <= 5 ? PRIMARY_DAYS : EXTENDED_DAYS;
            for (WeekDay day : sortedDaysByLoad(candidateDays, dayLoadMap)) {
                if (scheduledCount >= targetLectures) break;

                for (BaseTimeTablePeriod period : classPeriods) {
                    String slotKey = day + ":" + period.getId();
                    if (!occupiedSlots.contains(slotKey)
                            && isTeacherAvailable(teacher, day, period.getId(), teacherInternalBusySlots)) {

                        Room room = findFreeRoom(availableRooms, day, period, entries, false);

                        entries.add(buildEntry(version, day, period, subject, enrollment, room,
                                TimetableEntryType.THEORY, "Regular Lecture"));

                        occupiedSlots.add(slotKey);
                        teacherInternalBusySlots.add(teacher.getId() + ":" + slotKey);
                        dayLoadMap.put(day, dayLoadMap.get(day) + 1);
                        scheduledCount++;
                        break;
                    }
                }
            }
        }

        if (entries.isEmpty()) {
            throw new IllegalStateException(
                    "Unable to place any timetable entries without teacher or slot conflicts. Check teacher availability and base period capacity."
            );
        }

        entries.forEach(version::addEntry);
        SectionTimetableVersion savedVersion = versionRepo.save(version);

        if (savedVersion.getScope() == TimetableScope.SECTION) {
            managementService.ensureSectionTimetablePermissionRoot(savedVersion.getSection().getId());
            authorizationService.createChildPermission(
                    savedVersion.getId(),
                    ResourceType.TIMETABLE_VERSION,
                    savedVersion.getSection().getId(),
                    ResourceType.TIMETABLE
            );
        } else {
            managementService.ensureGroupTimetablePermissionRoot(savedVersion.getSectionGroup().getId());
            authorizationService.createChildPermission(
                    savedVersion.getId(),
                    ResourceType.GROUP_TIMETABLE_VERSION,
                    savedVersion.getSectionGroup().getId(),
                    ResourceType.GROUP_TIMETABLE
            );
        }

        if (r.isPublishImmediately()) {
            return managementService.publishVersion(savedVersion.getId(), null);
        }

        return savedVersion;
    }

    private boolean isPractical(Subject s) {
        if (Boolean.TRUE.equals(s.getIsPracticalSubject())) return true;
        String lower = s.getName() != null ? s.getName().toLowerCase() : "";
        return lower.contains("lab") || lower.contains("practical") || lower.contains("workshop");
    }

    private int computePracticalBlocksNeeded(Subject subject) {
        if (subject.getLecturesPerWeek() != null && subject.getLecturesPerWeek() >= 4) {
            return 2; // Two 2-period lab sessions per week if configured for 4+ lab hours
        }
        return 1; // Standard single 2-consecutive-period block per week
    }

    private List<WeekDay> sortedDaysByLoad(List<WeekDay> days, Map<WeekDay, Integer> dayLoadMap) {
        return days.stream()
                .sorted(Comparator.comparingInt(d -> dayLoadMap.getOrDefault(d, 0)))
                .toList();
    }

    private boolean isTeacherAvailable(Teacher teacher, WeekDay day, Long periodId, Set<String> teacherInternalBusySlots) {
        if (teacherInternalBusySlots.contains(teacher.getId() + ":" + day + ":" + periodId)) {
            return false;
        }
        return !entryRepo.existsByTeacherAndDayAndPeriodAndStatus(
                teacher, day, periodId, TimetableVersionStatus.PUBLISHED
        );
    }

    private void preloadComplementarySectionSlots(Long sectionId, TimetableScope targetScope, Long targetGroupId, Set<String> occupiedSlots) {
        List<SectionTimetableVersion> sectionVersions = versionRepo.findBySectionIdOrderByVersionNumberDesc(sectionId);
        if (targetScope == TimetableScope.SECTION_GROUP) {
            // Core SECTION slots cannot be overlapped by a group specialization timetable
            sectionVersions.stream()
                    .filter(v -> v.getScope() == TimetableScope.SECTION && v.getStatus() == TimetableVersionStatus.PUBLISHED)
                    .findFirst()
                    .ifPresent(v -> v.getEntries().stream()
                            .filter(e -> Boolean.TRUE.equals(e.getActive()))
                            .forEach(e -> occupiedSlots.add(e.getDayOfWeek() + ":" + e.getBasePeriod().getId())));
        } else {
            // Core SECTION timetable should also avoid published SECTION_GROUP slots under this section
            sectionVersions.stream()
                    .filter(v -> v.getScope() == TimetableScope.SECTION_GROUP && v.getStatus() == TimetableVersionStatus.PUBLISHED)
                    .forEach(v -> v.getEntries().stream()
                            .filter(e -> Boolean.TRUE.equals(e.getActive()))
                            .forEach(e -> occupiedSlots.add(e.getDayOfWeek() + ":" + e.getBasePeriod().getId())));
        }
    }

    private SectionTimetableEntry buildEntry(
            SectionTimetableVersion version,
            WeekDay day,
            BaseTimeTablePeriod period,
            Subject subject,
            TeacherEnrollment enrollment,
            Room room,
            TimetableEntryType entryType,
            String remarks
    ) {
        return SectionTimetableEntry.builder()
                .timetableVersion(version)
                .dayOfWeek(day)
                .basePeriod(period)
                .subject(subject)
                .teacherEnrollment(enrollment)
                .room(room)
                .entryType(entryType)
                .remarks(remarks)
                .active(true)
                .build();
    }

    private Room findFreeRoom(List<Room> rooms, WeekDay day, BaseTimeTablePeriod period, List<SectionTimetableEntry> currentEntries, boolean preferLab) {
        if (rooms == null || rooms.isEmpty()) return null;
        List<Room> sorted = sortRoomsBySuitability(rooms, preferLab);
        for (Room r : sorted) {
            boolean usedInCurrent = currentEntries.stream()
                    .anyMatch(e -> e.getDayOfWeek() == day &&
                            e.getBasePeriod().getId().equals(period.getId()) &&
                            e.getRoom() != null && e.getRoom().getId().equals(r.getId()));
            if (!usedInCurrent) {
                boolean busyInDb = entryRepo.existsByRoomAndDayAndPeriodAndStatus(
                        r.getId(), day, period.getId(), TimetableVersionStatus.PUBLISHED);
                if (!busyInDb) {
                    return r;
                }
            }
        }
        return sorted.get(0);
    }

    private Room findFreeRoomForConsecutive(List<Room> rooms, WeekDay day, BaseTimeTablePeriod p1, BaseTimeTablePeriod p2, List<SectionTimetableEntry> currentEntries, boolean preferLab) {
        if (rooms == null || rooms.isEmpty()) return null;
        List<Room> sorted = sortRoomsBySuitability(rooms, preferLab);
        for (Room r : sorted) {
            boolean usedInCurrent = currentEntries.stream()
                    .anyMatch(e -> e.getDayOfWeek() == day &&
                            (e.getBasePeriod().getId().equals(p1.getId()) || e.getBasePeriod().getId().equals(p2.getId())) &&
                            e.getRoom() != null && e.getRoom().getId().equals(r.getId()));
            if (!usedInCurrent) {
                boolean busy1 = entryRepo.existsByRoomAndDayAndPeriodAndStatus(r.getId(), day, p1.getId(), TimetableVersionStatus.PUBLISHED);
                boolean busy2 = entryRepo.existsByRoomAndDayAndPeriodAndStatus(r.getId(), day, p2.getId(), TimetableVersionStatus.PUBLISHED);
                if (!busy1 && !busy2) {
                    return r;
                }
            }
        }
        return sorted.get(0);
    }

    private List<Room> sortRoomsBySuitability(List<Room> rooms, boolean preferLab) {
        return rooms.stream()
                .sorted((a, b) -> {
                    int scoreA = roomSuitabilityScore(a, preferLab);
                    int scoreB = roomSuitabilityScore(b, preferLab);
                    return Integer.compare(scoreB, scoreA);
                })
                .toList();
    }

    private int roomSuitabilityScore(Room r, boolean preferLab) {
        if (r.getRoomType() == null) return 0;
        if (preferLab) {
            if (r.getRoomType() == Room.RoomType.LABORATORY) return 3;
            if (Boolean.TRUE.equals(r.getHasComputers())) return 2;
            return 1;
        } else {
            if (r.getRoomType() == Room.RoomType.CLASSROOM) return 3;
            if (r.getRoomType() == Room.RoomType.SEMINAR_HALL) return 2;
            return r.getRoomType() == Room.RoomType.LABORATORY ? 0 : 1;
        }
    }
}
