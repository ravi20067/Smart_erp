
package com.Smart.Erp.Modules.Finance.Services;

import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;

import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;

import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureRequest;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureResponse;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureUpdateRequest;

import com.Smart.Erp.Modules.Finance.Entity.FeeComponent;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Finance.Repo.FeeComponentRepo;
import com.Smart.Erp.Modules.Finance.Repo.FeeStructureRepo;
import com.Smart.Erp.Modules.Finance.Repo.FeeStructureSpecializationRepository;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Student.Services.StudentCommonService;

import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;

import com.Smart.Erp.Security.AuthorizationService;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeeStructureService {

    private final FeeStructureRepo repository;
    private final FeeStructureSpecializationRepository specializationRepo;
    private final FeeComponentRepo feeComponentRepo;

    private final AuthorizationService authorizationService;
    private final AcademicCommonService academicCommonService;
    private final AccountCommonService accountCommonService;
    private final StudentCommonService studentCommonService;

    // --------------------------------------------------
    // GET ALL FEE STRUCTURES
    // --------------------------------------------------

    public List<FeeStructureResponse> getFeeStructures() {

        Map<Long, List<PermissionAction>> permissionMap =
                authorizationService.getAll(ResourceType.FEE_STRUCTURE);

        List<FeeStructure> feeStructures =
                repository.findAllById(permissionMap.keySet());

        return feeStructures.stream()
                .map(feeStructure ->
                        feeStructure.mapToResponse(
                                permissionMap.getOrDefault(
                                        feeStructure.getId(),
                                        List.of()
                                )
                        )
                )
                .toList();
    }

    // --------------------------------------------------
    // CREATE FEE STRUCTURE
    // --------------------------------------------------

    @Transactional
    public FeeStructureResponse createFeeStructure(
            Long courseId,
            Long academicYearId,
            FeeStructureRequest request
    ) {

        Course course = academicCommonService.getCourse(courseId);

        AcademicYear academicYear =
                academicCommonService.getAcademicYear(academicYearId);

        // Resolve requested specializations
        List<Specialization> specializations =
                resolveSpecializations(request.getSpecializationId());

        // Validate specialization ownership and academic-year uniqueness
        validateSpecializations(
                course,
                academicYear,
                specializations,
                null
        );

        // Create fee structure and its relationships
        FeeStructure feeStructure =
                FeeStructure.createFromRequest(
                        request,
                        course,
                        academicYear,
                        specializations
                );

        feeStructure = repository.save(feeStructure);

        // Adjust student fee records
        List<StudentEnrollment> studentEnrollments =
                getStudentEnrollments(feeStructure);

        if (!studentEnrollments.isEmpty()) {
            studentCommonService.adjustFeeStructureChange(
                    studentEnrollments,
                    feeStructure
            );
        }

        // Create resource permissions
        authorizationService.createPermission(
                feeStructure.getId(),
                ResourceType.FEE_STRUCTURE,
                courseId,
                ResourceType.COURSE
        );

        return feeStructure.mapToResponse(
                authorizationService.getPermissionAction(
                        ResourceType.FEE_STRUCTURE,
                        feeStructure.getId()
                )
        );
    }

    // --------------------------------------------------
    // UPDATE FEE STRUCTURE
    // --------------------------------------------------

    @Transactional
    public FeeStructureResponse updateFeeStructure(
            Long id,
            FeeStructureUpdateRequest request
    ) {

        FeeStructure feeStructure =
                accountCommonService.getFeeStructure(id);

        BigDecimal oldTotalAmount =
                feeStructure.getTotalAmount();

        // Resolve requested specializations
        List<Specialization> specializations =
                resolveSpecializations(request.getSpecializationId());

        // Validate against other fee structures,
        // excluding the current fee structure
        validateSpecializations(
                feeStructure.getCourse(),
                feeStructure.getAcademicYear(),
                specializations,
                feeStructure.getId()
        );

        // Resolve components to remove
        List<Long> componentIds =
                request.getComponentToRemove() == null
                        ? List.of()
                        : request.getComponentToRemove();

        if (new HashSet<>(componentIds).size() != componentIds.size()) {
            throw new OperationNotAllowedException(
                    "Duplicate fee component IDs in removal request"
            );
        }

        List<FeeComponent> componentsToRemove =
                feeComponentRepo.findAllById(componentIds);

        if (componentsToRemove.size() != componentIds.size()) {
            throw new OperationNotAllowedException(
                    "One or more fee components do not exist"
            );
        }

        // Preserve previous enrollment references before synchronizing
        // specialization assignments.
        List<StudentEnrollment> previousEnrollments =
                getStudentEnrollments(feeStructure);

        // Update entity and relationships
        feeStructure.updateFromRequest(
                request,
                specializations,
                componentsToRemove
        );

        // Persist
        FeeStructure updatedFeeStructure =
                repository.save(feeStructure);

        BigDecimal newTotalAmount =
                updatedFeeStructure.getTotalAmount();

        // Adjust student fees if the amount changed
        if (oldTotalAmount.compareTo(newTotalAmount) != 0) {

            List<StudentEnrollment> currentEnrollments =
                    getStudentEnrollments(updatedFeeStructure);

            List<StudentEnrollment> enrollmentsToAdjust =
                    new ArrayList<>(previousEnrollments);

            enrollmentsToAdjust.addAll(currentEnrollments);

            List<StudentEnrollment> distinctEnrollments =
                    enrollmentsToAdjust.stream()
                            .distinct()
                            .toList();

            if (!distinctEnrollments.isEmpty()) {
                studentCommonService.adjustFeeStructureChange(
                        distinctEnrollments,
                        updatedFeeStructure
                );
            }
        }

        return updatedFeeStructure.mapToResponse(
                authorizationService.getPermissionAction(
                        ResourceType.FEE_STRUCTURE,
                        updatedFeeStructure.getId()
                )
        );
    }

    // --------------------------------------------------
    // DELETE FEE STRUCTURE
    // --------------------------------------------------

    @Transactional
    public void deleteFeeStructure(Long id) {

        FeeStructure feeStructure =
                accountCommonService.getFeeStructure(id);

        if (!feeStructure.getSpecializationAssignments().isEmpty()) {

            throw new OperationNotAllowedException(
                    "Cannot delete fee structure while specializations are assigned"
            );
        }

        repository.delete(feeStructure);

        authorizationService.deletePermission(
                ResourceType.FEE_STRUCTURE,
                id
        );
    }

    // --------------------------------------------------
    // SPECIALIZATION FILTER
    // --------------------------------------------------

    public List<CommonDTO> getSpecializationFilter(
            Long courseId,
            Long academicYearId
    ) {

        Course course =
                academicCommonService.getCourse(courseId);

        // Ensure the academic year exists
        academicCommonService.getAcademicYear(academicYearId);

        List<Specialization> specializations =
                course.getSpecializations();

        // Find specializations already assigned in this academic year
        Set<Long> assignedIds = new HashSet<>(
                specializationRepo.findAssignedSpecializationIds(
                        academicYearId,
                        courseId
                )
        );

        return specializations.stream()
                .filter(specialization ->
                        !assignedIds.contains(specialization.getId())
                )
                .map(Specialization::toCommonDTO)
                .toList();
    }

    // --------------------------------------------------
    // ACADEMIC YEAR FILTER
    // --------------------------------------------------

    public List<CommonDTO> getAcademicYearFilter(Long courseId) {

        return academicCommonService.getCourse(courseId)
                .getDepartment()
                .getSchool()
                .getUniversity()
                .getAcademicYears()
                .stream()
                .filter(academicYear ->
                        authorizationService.can(
                                PermissionAction.CREATE_CHILD,
                                ResourceType.ACADEMIC_YEAR,
                                academicYear.getId()
                        )
                )
                .map(CommonReference::toCommonDTO)
                .toList();
    }

    // --------------------------------------------------
    // COMMON VALIDATION METHODS
    // --------------------------------------------------

    private List<Specialization> resolveSpecializations(
            List<Long> specializationIds
    ) {

        if (specializationIds == null || specializationIds.isEmpty()) {
            return List.of();
        }

        Set<Long> uniqueIds = new HashSet<>(specializationIds);

        if (uniqueIds.size() != specializationIds.size()) {
            throw new OperationNotAllowedException(
                    "Duplicate specialization IDs are not allowed"
            );
        }

        List<Specialization> specializations =
                academicCommonService.getSpecialization(
                        specializationIds
                );

        if (specializations == null ||
                specializations.size() != specializationIds.size()) {

            throw new OperationNotAllowedException(
                    "One or more specializations do not exist"
            );
        }

        return specializations;
    }

    private void validateSpecializations(
            Course course,
            AcademicYear academicYear,
            List<Specialization> specializations,
            Long currentFeeStructureId
    ) {

        for (Specialization specialization : specializations) {

            // Validate course ownership
            if (specialization.getCourse() == null ||
                    !course.getId().equals(
                            specialization.getCourse().getId()
                    )) {

                throw new OperationNotAllowedException(
                        "Specialization " + specialization.getName()
                                + " does not belong to course "
                                + course.getName()
                );
            }

            // Check academic-year uniqueness
            boolean alreadyAssigned;

            if (currentFeeStructureId == null) {

                alreadyAssigned =
                        specializationRepo
                                .existsByAcademicYear_IdAndSpecialization_Id(
                                        academicYear.getId(),
                                        specialization.getId()
                                );

            } else {

                alreadyAssigned =
                        specializationRepo
                                .existsByAcademicYear_IdAndSpecialization_IdAndFeeStructure_IdNot(
                                        academicYear.getId(),
                                        specialization.getId(),
                                        currentFeeStructureId
                                );
            }

            if (alreadyAssigned) {

                throw new OperationNotAllowedException(
                        "Specialization " + specialization.getName()
                                + " is already assigned to another fee structure "
                                + "in academic year "
                                + academicYear.getName()
                );
            }
        }
    }

    // --------------------------------------------------
    // STUDENT ENROLLMENT HELPER
    // --------------------------------------------------

    private List<StudentEnrollment> getStudentEnrollments(
            FeeStructure feeStructure
    ) {

        return feeStructure.getSpecializationAssignments().stream()
                .map(assignment -> assignment.getSpecialization())
                .filter(java.util.Objects::nonNull)
                .flatMap(specialization ->
                        specialization.getSectionGroups().stream()
                                .flatMap(sectionGroup ->
                                        sectionGroup.getStudentEnrollments().stream()
                                )
                )
                .distinct()
                .toList();
    }
}
