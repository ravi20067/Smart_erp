package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionRequest;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Academic.Repo.*;
import com.Smart.Erp.Modules.Attendance.Entity.StudentFaceTemplate;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructureSpecialization;
import com.Smart.Erp.Modules.Finance.Services.AccountCommonService;
import com.Smart.Erp.Modules.Student.DTO.SectionGroupFilter;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentRequest;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Repo.StudentEnrollmentRepo;
import com.Smart.Erp.Modules.Student.Repo.StudentRepo;
import com.Smart.Erp.Modules.Student.Services.StudentCommonService;
import com.Smart.Erp.Modules.Student.Services.StudentService;
import com.Smart.Erp.Modules.Subject.Repo.SubjectRepo;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SectionAndStudentFlowTest {

    @Mock private UniversityRepo universityRepo;
    @Mock private AcademicYearRepository academicYearRepository;
    @Mock private SchoolRepo schoolRepo;
    @Mock private DepartmentRepo departmentRepo;
    @Mock private CourseRepo courseRepo;
    @Mock private SpecializationRepo specializationRepo;
    @Mock private SectionRepo sectionRepo;
    @Mock private SectionGroupRepo sectionGroupRepo;
    @Mock private StudentEnrollmentRepo studentEnrollmentRepo;
    @Mock private TeacherRepo teacherRepo;
    @Mock private UserCommonService userCommonService;
    @Mock private AuthorizationService authorizationService;
    @Mock private SubjectRepo subjectRepo;
    @Mock private EntityManager entityManager;

    @Mock private StudentRepo studentRepo;
    @Mock private StudentCommonService studentCommonService;
    @Mock private AccountCommonService accountCommonService;
    @Mock private AcademicCommonService mockedAcademicCommonService;

    private University university;
    private Course course;
    private AcademicYear academicYear;
    private Specialization mappedSpec;
    private Specialization unmappedSpec;
    private FeeStructure feeStructure;
    private Section sectionWithSeats;
    private SectionGroup mappedGroup;
    private SectionGroup unmappedGroup;

    @BeforeEach
    void setUp() {
        university = University.builder().id(1L).name("Smart Univ").code("SU").build();
        School school = School.builder().id(2L).name("SoE").code("SOE").university(university).build();
        Department dept = Department.builder().id(3L).name("CS").code("CS").school(school).build();

        academicYear = AcademicYear.builder()
                .id(10L)
                .name("2026-27")
                .code("SU26")
                .activeStatus(ActiveStatus.ENABLE)
                .university(university)
                .build();

        course = Course.builder()
                .id(100L)
                .name("B.Tech")
                .code("BT")
                .activeStatus(ActiveStatus.ENABLE)
                .newEnrollmentAllowed(true)
                .department(dept)
                .build();

        mappedSpec = Specialization.builder()
                .id(201L)
                .name("AI")
                .code("BTAI")
                .activeStatus(ActiveStatus.ENABLE)
                .course(course)
                .build();

        unmappedSpec = Specialization.builder()
                .id(202L)
                .name("Robotics")
                .code("BTROB")
                .activeStatus(ActiveStatus.ENABLE)
                .course(course)
                .build();

        course.getSpecializations().addAll(List.of(mappedSpec, unmappedSpec));

        feeStructure = FeeStructure.builder()
                .id(300L)
                .name("B.Tech 2026 Fee")
                .course(course)
                .academicYear(academicYear)
                .build();

        FeeStructureSpecialization mapping = FeeStructureSpecialization.create(feeStructure, mappedSpec);
        feeStructure.getSpecializationAssignments().add(mapping);
        mappedSpec.getFeeStructureAssignments().add(mapping);

        sectionWithSeats = Section.builder()
                .id(400L)
                .name("Sec A")
                .code("26-BTA")
                .capacity(2)
                .activeStatus(ActiveStatus.ENABLE)
                .academicYear(academicYear)
                .course(course)
                .build();

        mappedGroup = SectionGroup.builder()
                .id(501L)
                .name("Sec A-AI")
                .section(sectionWithSeats)
                .specialization(mappedSpec)
                .build();

        unmappedGroup = SectionGroup.builder()
                .id(502L)
                .name("Sec A-Robotics")
                .section(sectionWithSeats)
                .specialization(unmappedSpec)
                .build();

        sectionWithSeats.getSectionGroups().addAll(List.of(mappedGroup, unmappedGroup));
    }

    @Test
    void studentEntityProvidesDirectFaceTemplateAccessAndLifecycle() {
        BasicDetail detail = BasicDetail.builder().firstName("Aarav").lastName("Mehta").build();
        User user = User.builder().id(1L).username("aarav").enabled(true).basicDetail(detail).build();
        detail.setUser(user);
        Student student = Student.builder().id(77L).registrationNumber("REG-77").user(user).build();

        assertFalse(student.hasActiveFaceTemplate());
        assertFalse(student.mapToResponse().getHasEnrolledFace());

        LocalDateTime enrolledAt = LocalDateTime.now().withNano(0);
        StudentFaceTemplate tpl = StudentFaceTemplate.builder()
                .id(901L)
                .algorithm("SFACE")
                .embeddingDimension(128)
                .encryptedEmbedding("enc-vec-v1")
                .status("ACTIVE")
                .enrolledAt(enrolledAt)
                .build();

        student.assignFaceTemplate(tpl);

        assertSame(student, tpl.getStudent());
        assertTrue(student.hasActiveFaceTemplate());
        assertTrue(student.mapToResponse().getHasEnrolledFace());
        assertEquals(enrolledAt, student.mapToResponse().getFaceEnrolledAt());

        student.clearFaceTemplate();

        assertNull(student.getFaceTemplate());
        assertNull(tpl.getStudent());
        assertFalse(student.hasActiveFaceTemplate());
    }

    @Test
    void academicCommonServiceFiltersOnlyEligibleGroupsWithValidFeeStructureAndSeats() {
        AcademicCommonService service = new AcademicCommonService(
                universityRepo, academicYearRepository, schoolRepo, departmentRepo, courseRepo,
                specializationRepo, sectionRepo, sectionGroupRepo, studentEnrollmentRepo,
                teacherRepo, userCommonService, authorizationService, subjectRepo, entityManager
        );

        when(authorizationService.getAll(ResourceType.SECTION_GROUP)).thenReturn(Map.of(
                501L, List.of(PermissionAction.READ),
                502L, List.of(PermissionAction.READ)
        ));
        when(sectionGroupRepo.findAllById(any())).thenReturn(List.of(mappedGroup, unmappedGroup));

        List<SectionGroupFilter> eligible = service.filterSectionGroupForStudentPage(201L, 10L);
        assertEquals(1, eligible.size());
        assertEquals(501L, eligible.get(0).getSectionGroup().getId());
        assertEquals(300L, eligible.get(0).getFeeStructure().getId());
        assertEquals(2, eligible.get(0).getAvailableSeats());

        // Fill capacity to 2 students -> student page must return empty, section page still shows fee-mapped group
        mappedGroup.getStudentEnrollments().add(new StudentEnrollment());
        mappedGroup.getStudentEnrollments().add(new StudentEnrollment());

        assertTrue(service.filterSectionGroupForStudentPage(201L, 10L).isEmpty());
        assertEquals(1, service.filterSectionGroupForSectionPage(201L, 10L).size());
    }

    @Test
    void sectionServiceFiltersSpecializationsByFeeStructureAndEnforcesMappingOnCreate() {
        SectionService sectionService = new SectionService(
                sectionRepo, mockedAcademicCommonService, authorizationService, sectionGroupRepo
        );

        when(mockedAcademicCommonService.getCourse(100L)).thenReturn(course);
        when(mockedAcademicCommonService.getAcademicYear(10L)).thenReturn(academicYear);

        List<CommonDTO> eligibleSpecs = sectionService.getSpecializationFilter(100L, 10L);
        assertEquals(1, eligibleSpecs.size());
        assertEquals(201L, eligibleSpecs.get(0).getId());

        SectionRequest invalidReq = new SectionRequest("Sec B", "B", 60, ActiveStatus.ENABLE, List.of(202L));
        when(mockedAcademicCommonService.getSpecialization(List.of(202L))).thenReturn(List.of(unmappedSpec));

        OperationNotAllowedException ex = assertThrows(
                OperationNotAllowedException.class,
                () -> sectionService.create(100L, invalidReq, 10L)
        );
        assertTrue(ex.getMessage().contains("does not have a valid mapped fee structure"));
    }

    @Test
    void studentServiceChecksActualStudentCountAgainstCapacityAndRequiresFeeStructure() {
        StudentService studentService = new StudentService(
                studentRepo, studentEnrollmentRepo, studentCommonService,
                mockedAcademicCommonService, accountCommonService, userCommonService, authorizationService
        );

        // 2 students already enrolled inside 1 group while sectionGroups.size() is 2 and capacity is 2
        mappedGroup.getStudentEnrollments().add(new StudentEnrollment());
        mappedGroup.getStudentEnrollments().add(new StudentEnrollment());

        StudentRequest fullReq = new StudentRequest();
        fullReq.setSectionGroupId(501L);
        when(mockedAcademicCommonService.getSectionGroup(501L)).thenReturn(mappedGroup);

        OperationNotAllowedException fullEx = assertThrows(
                OperationNotAllowedException.class,
                () -> studentService.create(fullReq, null)
        );
        assertTrue(fullEx.getMessage().contains("Section is full"));

        // Unmapped specialization group cannot enroll even when section has spare seats
        StudentRequest unmappedReq = new StudentRequest();
        unmappedReq.setSectionGroupId(502L);
        when(mockedAcademicCommonService.getSectionGroup(502L)).thenReturn(unmappedGroup);

        OperationNotAllowedException feeEx = assertThrows(
                OperationNotAllowedException.class,
                () -> studentService.create(unmappedReq, null)
        );
        assertTrue(feeEx.getMessage().contains("does not have a mapped fee structure"));
    }
}
