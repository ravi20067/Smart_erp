package com.Smart.Erp.Modules.TimeTable.Services;

import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Subject.Repo.SubjectRepo;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.TimeTable.DTO.AutoGenerateTimetableRequest;
import com.Smart.Erp.Modules.TimeTable.Entity.BaseTimeTable;
import com.Smart.Erp.Modules.TimeTable.Entity.BaseTimeTablePeriod;
import com.Smart.Erp.Modules.TimeTable.Entity.Room;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableEntry;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableVersion;
import com.Smart.Erp.Modules.TimeTable.Enum.BasePeriodType;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableEntryType;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableScope;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableVersionStatus;
import com.Smart.Erp.Modules.TimeTable.Enum.WeekDay;
import com.Smart.Erp.Modules.TimeTable.Repo.BaseTimeTableRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.RoomRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionTimetableEntryRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionTimetableVersionRepo;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Security.AuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutomaticTimetableGeneratorServiceTest {

    @Mock private BaseTimeTableRepo baseRepo;
    @Mock private SectionTimetableVersionRepo versionRepo;
    @Mock private SectionTimetableEntryRepo entryRepo;
    @Mock private RoomRepo roomRepo;
    @Mock private SubjectRepo subjectRepo;
    @Mock private AcademicCommonService academic;
    @Mock private AuthorizationService authorizationService;
    @Mock private TimetableManagementService managementService;

    @InjectMocks
    private AutomaticTimetableGeneratorService generatorService;

    private Course course;
    private Section section;
    private Specialization specAi;
    private Specialization specCyber;
    private SectionGroup groupAi;
    private BaseTimeTable baseTimeTable;
    private BaseTimeTablePeriod p1, p2, breakMid, p3, p4;
    private Room classroom;
    private Room labRoom;

    @BeforeEach
    void setUp() {
        course = Course.builder().id(1L).name("B.Tech CSE").build();
        section = Section.builder().id(10L).name("CSE-A").course(course).build();

        specAi = new Specialization();
        specAi.setId(100L);
        specAi.setName("AI & ML");

        specCyber = new Specialization();
        specCyber.setId(101L);
        specCyber.setName("Cyber Security");

        groupAi = SectionGroup.builder()
                .id(20L)
                .name("Group A1")
                .section(section)
                .specialization(specAi)
                .build();

        p1 = period(1L, 1, 1, BasePeriodType.CLASS, "Period 1", 9, 0);
        p2 = period(2L, 2, 2, BasePeriodType.CLASS, "Period 2", 10, 0);
        breakMid = period(3L, 3, null, BasePeriodType.BREAK, "Lunch Break", 11, 0);
        p3 = period(4L, 4, 3, BasePeriodType.CLASS, "Period 3", 12, 0);
        p4 = period(5L, 5, 4, BasePeriodType.CLASS, "Period 4", 13, 0);

        baseTimeTable = BaseTimeTable.builder()
                .id(5L)
                .name("Standard Day")
                .periodsPerDay(4)
                .active(true)
                .periods(new ArrayList<>(List.of(p1, p2, breakMid, p3, p4)))
                .build();

        classroom = new Room();
        classroom.setId(501L);
        classroom.setRoomNumber("C-101");
        classroom.setRoomType(Room.RoomType.CLASSROOM);

        labRoom = new Room();
        labRoom.setId(502L);
        labRoom.setRoomNumber("L-201");
        labRoom.setRoomType(Room.RoomType.LABORATORY);
        labRoom.setHasComputers(true);

        lenient().when(academic.getSection(10L)).thenReturn(section);
        lenient().when(academic.getSectionGroup(20L)).thenReturn(groupAi);
        lenient().when(baseRepo.findById(5L)).thenReturn(Optional.of(baseTimeTable));
        lenient().when(roomRepo.findAll()).thenReturn(List.of(classroom, labRoom));
        lenient().when(versionRepo.save(any(SectionTimetableVersion.class))).thenAnswer(inv -> {
            SectionTimetableVersion v = inv.getArgument(0);
            if (v.getId() == null) v.setId(999L);
            return v;
        });
    }

    @Test
    void sectionScopeStrictlySchedulesCoreSubjectsAndExcludesSpecializations() {
        TeacherEnrollment teCore = teacherEnrollment(1L, 1001L);
        TeacherEnrollment teSpec = teacherEnrollment(2L, 1002L);

        Subject coreSubj = subject(1L, "Data Structures", "CS201", 3, false, List.of(), Set.of(teCore));
        Subject specSubj = subject(2L, "Deep Learning", "AI401", 3, false, List.of(specAi), Set.of(teSpec));

        when(subjectRepo.findByCourse_Id(1L)).thenReturn(List.of(coreSubj, specSubj));

        AutoGenerateTimetableRequest req = AutoGenerateTimetableRequest.builder()
                .sectionId(10L)
                .scope(TimetableScope.SECTION)
                .baseTimeTableId(5L)
                .effectiveFrom(LocalDate.now())
                .build();

        SectionTimetableVersion result = generatorService.generateAutomaticTimetable(req);

        assertFalse(result.getEntries().isEmpty());
        assertTrue(result.getEntries().stream().allMatch(e -> e.getSubject().getId().equals(1L)),
                "SECTION scope must only schedule core subjects without specializations");
    }

    @Test
    void sectionGroupScopeSchedulesOnlyMatchingSpecializationAndAvoidsPublishedSectionSlots() {
        TeacherEnrollment teCore = teacherEnrollment(1L, 1001L);
        TeacherEnrollment teAi = teacherEnrollment(2L, 1002L);
        TeacherEnrollment teCyber = teacherEnrollment(3L, 1003L);

        Subject coreSubj = subject(1L, "Algorithms", "CS202", 2, false, List.of(), Set.of(teCore));
        Subject aiSubj = subject(2L, "Neural Networks", "AI402", 2, false, List.of(specAi), Set.of(teAi));
        Subject cyberSubj = subject(3L, "Network Forensics", "CY402", 2, false, List.of(specCyber), Set.of(teCyber));

        // Published core SECTION timetable already occupies (MONDAY, p1)
        SectionTimetableEntry occupiedCoreEntry = SectionTimetableEntry.builder()
                .id(77L)
                .dayOfWeek(WeekDay.MONDAY)
                .basePeriod(p1)
                .subject(coreSubj)
                .teacherEnrollment(teCore)
                .active(true)
                .build();
        SectionTimetableVersion publishedCore = SectionTimetableVersion.builder()
                .id(88L)
                .scope(TimetableScope.SECTION)
                .status(TimetableVersionStatus.PUBLISHED)
                .entries(List.of(occupiedCoreEntry))
                .build();

        when(subjectRepo.findByCourse_Id(1L)).thenReturn(List.of(coreSubj, aiSubj, cyberSubj));
        when(versionRepo.findBySectionIdOrderByVersionNumberDesc(10L)).thenReturn(List.of(publishedCore));

        AutoGenerateTimetableRequest req = AutoGenerateTimetableRequest.builder()
                .sectionId(10L)
                .sectionGroupId(20L)
                .scope(TimetableScope.SECTION_GROUP)
                .baseTimeTableId(5L)
                .effectiveFrom(LocalDate.now())
                .build();

        SectionTimetableVersion result = generatorService.generateAutomaticTimetable(req);

        assertEquals(TimetableScope.SECTION_GROUP, result.getScope());
        assertEquals(2, result.getEntries().size());
        assertTrue(result.getEntries().stream().allMatch(e -> e.getSubject().getId().equals(2L)),
                "SECTION_GROUP scope must only contain matching AI & ML specialization subjects");
        assertTrue(result.getEntries().stream().noneMatch(e ->
                        e.getDayOfWeek() == WeekDay.MONDAY && e.getBasePeriod().getId().equals(p1.getId())),
                "SECTION_GROUP schedule must never collide with published core SECTION slot");
    }

    @Test
    void practicalSubjectAllocatesTwoTrulyContiguousClassPeriodsNeverAcrossBreak() {
        TeacherEnrollment teLab = teacherEnrollment(10L, 2001L);
        Subject labSubj = subject(5L, "Operating Systems Lab", "CS305", 2, true, List.of(), Set.of(teLab));

        // Make p1 unavailable for the teacher on ALL days so only (p3, p4) is a contiguous pair;
        // (p2, p3) MUST NEVER be chosen because breakMid separates sequenceNumber 2 and 4!
        when(entryRepo.existsByTeacherAndDayAndPeriodAndStatus(
                eq(teLab.getTeacher()), any(WeekDay.class), eq(p1.getId()), eq(TimetableVersionStatus.PUBLISHED)))
                .thenReturn(true);
        when(subjectRepo.findByCourse_Id(1L)).thenReturn(List.of(labSubj));

        AutoGenerateTimetableRequest req = AutoGenerateTimetableRequest.builder()
                .sectionId(10L)
                .scope(TimetableScope.SECTION)
                .baseTimeTableId(5L)
                .effectiveFrom(LocalDate.now())
                .build();

        SectionTimetableVersion result = generatorService.generateAutomaticTimetable(req);

        assertEquals(2, result.getEntries().size());
        List<SectionTimetableEntry> sorted = result.getEntries().stream()
                .sorted(Comparator.comparing(e -> e.getBasePeriod().getSequenceNumber()))
                .toList();

        assertEquals(sorted.get(0).getDayOfWeek(), sorted.get(1).getDayOfWeek());
        assertEquals(p3.getSequenceNumber(), sorted.get(0).getBasePeriod().getSequenceNumber());
        assertEquals(p4.getSequenceNumber(), sorted.get(1).getBasePeriod().getSequenceNumber());
        assertEquals(TimetableEntryType.PRACTICAL, sorted.get(0).getEntryType());
        assertEquals(TimetableEntryType.PRACTICAL, sorted.get(1).getEntryType());
        assertEquals(labRoom.getId(), sorted.get(0).getRoom().getId(),
                "Practical lab must prioritize LABORATORY room type");
    }

    @Test
    void assignsStrictlyOneTeacherPerSubjectAndHonorsPublishedTeacherConflicts() {
        TeacherEnrollment te1 = teacherEnrollment(11L, 3001L);
        TeacherEnrollment te2 = teacherEnrollment(12L, 3002L);

        // Two teachers eligible to teach Theory subject, plus published conflict on te1 Monday P1
        Subject theorySubj = subject(7L, "Computer Networks", "CS301", 3, false,
                List.of(), new LinkedHashSet<>(List.of(te1, te2)));

        when(subjectRepo.findByCourse_Id(1L)).thenReturn(List.of(theorySubj));
        when(entryRepo.existsByTeacherAndDayAndPeriodAndStatus(
                eq(te1.getTeacher()), eq(WeekDay.MONDAY), eq(p1.getId()), eq(TimetableVersionStatus.PUBLISHED)))
                .thenReturn(true);

        AutoGenerateTimetableRequest req = AutoGenerateTimetableRequest.builder()
                .sectionId(10L)
                .scope(TimetableScope.SECTION)
                .baseTimeTableId(5L)
                .effectiveFrom(LocalDate.now())
                .build();

        SectionTimetableVersion result = generatorService.generateAutomaticTimetable(req);

        assertEquals(3, result.getEntries().size());
        Set<Long> assignedTeacherIds = new HashSet<>();
        result.getEntries().forEach(e -> assignedTeacherIds.add(e.getTeacherEnrollment().getTeacher().getId()));
        assertEquals(1, assignedTeacherIds.size(), "Only 1 dedicated teacher may teach a subject within a section");

        assertTrue(result.getEntries().stream().noneMatch(e ->
                e.getTeacherEnrollment().getTeacher().getId().equals(3001L)
                        && e.getDayOfWeek() == WeekDay.MONDAY
                        && e.getBasePeriod().getId().equals(p1.getId())));
    }

    private BaseTimeTablePeriod period(Long id, int seq, Integer periodNum, BasePeriodType type, String label, int hour, int min) {
        return BaseTimeTablePeriod.builder()
                .id(id)
                .sequenceNumber(seq)
                .periodNumber(periodNum)
                .periodType(type)
                .label(label)
                .startTime(LocalTime.of(hour, min))
                .endTime(LocalTime.of(hour + 1, min))
                .durationMinutes(60)
                .active(true)
                .build();
    }

    private TeacherEnrollment teacherEnrollment(Long enrollId, Long teacherId) {
        Teacher teacher = Teacher.builder().id(teacherId).build();
        return TeacherEnrollment.builder()
                .id(enrollId)
                .teacher(teacher)
                .status(EnrollmentStatus.ACTIVE)
                .build();
    }

    private Subject subject(
            Long id,
            String name,
            String code,
            int lecturesPerWeek,
            boolean practical,
            List<Specialization> specs,
            Set<TeacherEnrollment> teachers
    ) {
        Subject s = new Subject();
        s.setId(id);
        s.setName(name);
        s.setCode(code);
        s.setCourse(course);
        s.setLecturesPerWeek(lecturesPerWeek);
        s.setIsPracticalSubject(practical);
        s.setSpecializations(new ArrayList<>(specs));
        s.setSubjectTeachers(new HashSet<>(teachers));
        s.setActiveStatus(ActiveStatus.ENABLE);
        return s;
    }
}
