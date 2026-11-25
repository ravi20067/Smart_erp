package com.Smart.Erp.Modules.Finance.Services;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeComponentRequest;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureRequest;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureResponse;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureUpdateRequest;
import com.Smart.Erp.Modules.Finance.Entity.FeeComponent;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Finance.Entity.StudentFeeAccount;
import com.Smart.Erp.Modules.Finance.Enum.FeeCategoryType;
import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import com.Smart.Erp.Modules.Finance.Repo.FeeComponentRepo;
import com.Smart.Erp.Modules.Finance.Repo.FeeStructureRepo;
import com.Smart.Erp.Modules.Finance.Repo.FeeStructureSpecializationRepository;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Services.StudentCommonService;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Security.AuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeeStructureServiceTest {

    @Mock private FeeStructureRepo repository;
    @Mock private FeeStructureSpecializationRepository specializationRepo;
    @Mock private FeeComponentRepo feeComponentRepo;
    @Mock private AuthorizationService authorizationService;
    @Mock private AcademicCommonService academicCommonService;
    @Mock private AccountCommonService accountCommonService;
    @Mock private StudentCommonService studentCommonService;

    @InjectMocks
    private FeeStructureService feeStructureService;

    private University university;
    private Course course;
    private AcademicYear academicYear2026;
    private AcademicYear academicYear2025;
    private Specialization specAi;

    @BeforeEach
    void setUp() {
        university = University.builder().id(1L).name("Smart University").code("SU").build();
        School school = School.builder().id(2L).name("Engineering").code("ENG").university(university).build();
        Department department = Department.builder().id(3L).name("CSE").code("CSE").school(school).build();

        academicYear2025 = AcademicYear.builder()
                .id(10L).name("2025-26").code("SU25").activeStatus(ActiveStatus.ENABLE).university(university).build();
        academicYear2026 = AcademicYear.builder()
                .id(11L).name("2026-27").code("SU26").activeStatus(ActiveStatus.ENABLE).university(university).build();
        university.getAcademicYears().addAll(List.of(academicYear2025, academicYear2026));

        course = Course.builder()
                .id(100L)
                .name("B.Tech CSE")
                .code("BTCSE")
                .activeStatus(ActiveStatus.ENABLE)
                .newEnrollmentAllowed(true)
                .department(department)
                .build();

        specAi = Specialization.builder()
                .id(200L)
                .name("AI & ML")
                .code("BTCSE-AI")
                .activeStatus(ActiveStatus.ENABLE)
                .course(course)
                .build();
        course.getSpecializations().add(specAi);
    }

    private FeeStructureRequest validRequest(List<Long> specIds) {
        return FeeStructureRequest.builder()
                .name("B.Tech Annual Fee 2026")
                .frequency(FeeFrequency.ANNUAL)
                .totalNoOfInstallments(2)
                .specializationId(specIds)
                .components(List.of(
                        FeeComponentRequest.builder()
                                .feeCategoryType(FeeCategoryType.TUITION)
                                .componentName("Tuition Fee")
                                .amount(new BigDecimal("50000"))
                                .isMandatory(true)
                                .isRefundable(false)
                                .build(),
                        FeeComponentRequest.builder()
                                .feeCategoryType(FeeCategoryType.LIBRARY)
                                .componentName("Library Deposit")
                                .amount(new BigDecimal("2000"))
                                .isMandatory(false)
                                .isRefundable(true)
                                .build()
                ))
                .build();
    }

    @Test
    void createFeeStructureRejectsDuplicateForSameCourseAndAcademicYear() {
        when(academicCommonService.getCourse(100L)).thenReturn(course);
        when(academicCommonService.getAcademicYear(11L)).thenReturn(academicYear2026);
        when(repository.existsByCourse_IdAndAcademicYear_Id(100L, 11L)).thenReturn(true);

        OperationNotAllowedException ex = assertThrows(
                OperationNotAllowedException.class,
                () -> feeStructureService.createFeeStructure(100L, 11L, validRequest(List.of(200L)))
        );

        assertTrue(ex.getMessage().contains("Only one fee structure per course and academic year is allowed"));
        verify(repository, never()).save(any());
    }

    @Test
    void createFeeStructureEnforcesMappingCompleteness() {
        when(academicCommonService.getCourse(100L)).thenReturn(course);
        when(academicCommonService.getAcademicYear(11L)).thenReturn(academicYear2026);
        when(repository.existsByCourse_IdAndAcademicYear_Id(100L, 11L)).thenReturn(false);

        OperationNotAllowedException ex = assertThrows(
                OperationNotAllowedException.class,
                () -> feeStructureService.createFeeStructure(100L, 11L, validRequest(List.of()))
        );

        assertTrue(ex.getMessage().contains("At least one specialization"));
        verify(repository, never()).save(any());
    }

    @Test
    void createFeeStructureRejectsDifferentUniversity() {
        University otherUniversity = University.builder().id(99L).name("Other Univ").code("OU").build();
        AcademicYear otherYear = AcademicYear.builder()
                .id(12L).name("2026 Other").code("OU26").activeStatus(ActiveStatus.ENABLE).university(otherUniversity).build();

        when(academicCommonService.getCourse(100L)).thenReturn(course);
        when(academicCommonService.getAcademicYear(12L)).thenReturn(otherYear);

        OperationNotAllowedException ex = assertThrows(
                OperationNotAllowedException.class,
                () -> feeStructureService.createFeeStructure(100L, 12L, validRequest(List.of(200L)))
        );

        assertTrue(ex.getMessage().contains("different universities"));
    }

    @Test
    void getTotalAmountHandlesNullMandatoryBooleanAndRejectsDuplicateCategories() {
        FeeStructure fs = FeeStructure.builder().id(1L).name("Test").frequency(FeeFrequency.ANNUAL).build();
        fs.addComponent(FeeComponent.builder().categoryType(FeeCategoryType.TUITION).componentName("Tuition").amount(new BigDecimal("10000")).isMandatory(true).build());
        fs.addComponent(FeeComponent.builder().categoryType(FeeCategoryType.LIBRARY).componentName("NullMand").amount(new BigDecimal("500")).isMandatory(null).build());

        assertEquals(new BigDecimal("10000"), fs.getTotalAmount());

        FeeStructureRequest duplicateCategoryReq = FeeStructureRequest.builder()
                .name("Duplicate Category")
                .frequency(FeeFrequency.ANNUAL)
                .totalNoOfInstallments(1)
                .specializationId(List.of(200L))
                .components(List.of(
                        FeeComponentRequest.builder().feeCategoryType(FeeCategoryType.TUITION).componentName("T1").amount(BigDecimal.TEN).isMandatory(true).isRefundable(false).build(),
                        FeeComponentRequest.builder().feeCategoryType(FeeCategoryType.TUITION).componentName("T2").amount(BigDecimal.ONE).isMandatory(true).isRefundable(false).build()
                ))
                .build();

        assertThrows(
                OperationNotAllowedException.class,
                () -> FeeStructure.createFromRequest(duplicateCategoryReq, course, academicYear2026, List.of(specAi))
        );
    }

    @Test
    void getAcademicYearFilterExcludesYearsAlreadyMappedForCourse() {
        when(academicCommonService.getCourse(100L)).thenReturn(course);
        when(repository.existsByCourse_IdAndAcademicYear_Id(100L, 10L)).thenReturn(true);
        when(repository.existsByCourse_IdAndAcademicYear_Id(100L, 11L)).thenReturn(false);
        when(authorizationService.can(PermissionAction.CREATE_CHILD, ResourceType.ACADEMIC_YEAR, 11L)).thenReturn(true);

        List<CommonDTO> years = feeStructureService.getAcademicYearFilter(100L);

        assertEquals(1, years.size());
        assertEquals(11L, years.get(0).getId());
    }

    @Test
    void createFeeStructureAdjustsOnlyEnrollmentsMatchingFeeStructureAcademicYear() {
        Section section2025 = Section.builder().id(1L).name("A-25").academicYear(academicYear2025).course(course).capacity(60).build();
        Section section2026 = Section.builder().id(2L).name("A-26").academicYear(academicYear2026).course(course).capacity(60).build();
        SectionGroup group2025 = SectionGroup.builder().id(11L).name("A-25-AI").section(section2025).specialization(specAi).build();
        SectionGroup group2026 = SectionGroup.builder().id(12L).name("A-26-AI").section(section2026).specialization(specAi).build();

        StudentEnrollment enrollment2025 = StudentEnrollment.builder().id(501L).sectionGroup(group2025).firstFeeAccount(new StudentFeeAccount()).build();
        StudentEnrollment enrollment2026 = StudentEnrollment.builder().id(502L).sectionGroup(group2026).firstFeeAccount(new StudentFeeAccount()).build();
        group2025.getStudentEnrollments().add(enrollment2025);
        group2026.getStudentEnrollments().add(enrollment2026);
        specAi.getSectionGroups().addAll(List.of(group2025, group2026));

        when(academicCommonService.getCourse(100L)).thenReturn(course);
        when(academicCommonService.getAcademicYear(11L)).thenReturn(academicYear2026);
        when(repository.existsByCourse_IdAndAcademicYear_Id(100L, 11L)).thenReturn(false);
        when(academicCommonService.getSpecialization(List.of(200L))).thenReturn(List.of(specAi));
        when(specializationRepo.existsByAcademicYear_IdAndSpecialization_Id(11L, 200L)).thenReturn(false);
        when(repository.save(any(FeeStructure.class))).thenAnswer(inv -> {
            FeeStructure saved = inv.getArgument(0);
            saved.setId(77L);
            return saved;
        });
        when(authorizationService.getPermissionAction(ResourceType.FEE_STRUCTURE, 77L))
                .thenReturn(List.of(PermissionAction.READ, PermissionAction.UPDATE));

        FeeStructureResponse response = feeStructureService.createFeeStructure(100L, 11L, validRequest(List.of(200L)));

        assertEquals(77L, response.getId());
        verify(studentCommonService).adjustFeeStructureChange(eq(List.of(enrollment2026)), any(FeeStructure.class));
    }

    @Test
    void deleteFeeStructureClearsUnusedSpecializationsOrBlocksWhenEnrolled() {
        FeeStructure unusedFs = FeeStructure.createFromRequest(validRequest(List.of(200L)), course, academicYear2026, List.of(specAi));
        unusedFs.setId(88L);

        when(accountCommonService.getFeeStructure(88L)).thenReturn(unusedFs);
        feeStructureService.deleteFeeStructure(88L);
        verify(repository).delete(unusedFs);
        verify(authorizationService).deletePermission(ResourceType.FEE_STRUCTURE, 88L);

        Section section2026 = Section.builder().id(2L).name("A-26").academicYear(academicYear2026).course(course).capacity(60).build();
        SectionGroup group2026 = SectionGroup.builder().id(12L).name("A-26-AI").section(section2026).specialization(specAi).build();
        group2026.getStudentEnrollments().add(StudentEnrollment.builder().id(999L).sectionGroup(group2026).build());
        specAi.getSectionGroups().add(group2026);

        FeeStructure inUseFs = FeeStructure.createFromRequest(validRequest(List.of(200L)), course, academicYear2026, List.of(specAi));
        inUseFs.setId(89L);
        when(accountCommonService.getFeeStructure(89L)).thenReturn(inUseFs);

        assertThrows(OperationNotAllowedException.class, () -> feeStructureService.deleteFeeStructure(89L));
    }
}
