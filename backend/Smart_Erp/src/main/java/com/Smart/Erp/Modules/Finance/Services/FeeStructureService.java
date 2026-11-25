
package com.Smart.Erp.Modules.Finance.Services;

import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;

import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;

import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureRequest;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureResponse;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureUpdateRequest;

import com.Smart.Erp.Modules.Finance.Entity.FeeComponent;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructureSpecialization;
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
import java.util.Objects;
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

        // Enforce single fee structure per course & academic year plus active status & university consistency
        validateCourseAndAcademicYear(course, academicYear, null);

        // Resolve requested specializations
        List<Specialization> specializations =
                resolveSpecializations(request != null ? request.getSpecializationId() : null);

        // Validate specialization ownership, mapping completeness, and academic-year uniqueness
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

        // Adjust student fee records for the target academic year only
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

        // Enforce single fee structure per course & academic year
        validateCourseAndAcademicYear(
                feeStructure.getCourse(),
                feeStructure.getAcademicYear(),
                feeStructure.getId()
        );

        // Resolve requested specializations
        List<Specialization> specializations =
                resolveSpecializations(request != null ? request.getSpecializationId() : null);

        // Validate against other fee structures,
        // excluding the current fee structure
        validateSpecializations(
                feeStructure.getCourse(),
                feeStructure.getAcademicYear(),
                specializations,
                feeStructure.getId()
        );

        // Guard against unmapping specializations that already have enrolled students in this academic year
        validateNoEnrolledSpecializationRemoval(feeStructure, specializations);

        // Resolve components to remove
        List<Long> componentIds =
                (request == null || request.getComponentToRemove() == null)
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

        List<StudentEnrollment> activeEnrollments =
                getStudentEnrollments(feeStructure);

        if (!activeEnrollments.isEmpty()) {

            throw new OperationNotAllowedException(
                    "Cannot delete fee structure while students are enrolled in academic year "
                            + (feeStructure.getAcademicYear() != null
                                    ? feeStructure.getAcademicYear().getName()
                                    : "")
            );
        }

        feeStructure.getSpecializationAssignments().clear();
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

        AcademicYear academicYear =
                academicCommonService.getAcademicYear(academicYearId);

        validateSameUniversity(course, academicYear);

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
                        specialization.getActiveStatus() == ActiveStatus.ENABLE
                                && !assignedIds.contains(specialization.getId())
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
                        academicYear.getActiveStatus() == ActiveStatus.ENABLE
                                && !repository.existsByCourse_IdAndAcademicYear_Id(
                                        courseId,
                                        academicYear.getId()
                                )
                                && authorizationService.can(
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

    private void validateCourseAndAcademicYear(
            Course course,
            AcademicYear academicYear,
            Long currentFeeStructureId
    ) {
        if (course == null || academicYear == null) {
            throw new OperationNotAllowedException(
                    "Course and academic year are required for fee structure"
            );
        }

        validateSameUniversity(course, academicYear);

        if (currentFeeStructureId == null) {
            if (course.getActiveStatus() != ActiveStatus.ENABLE) {
                throw new OperationNotAllowedException(
                        "Course " + course.getName() + " is not enabled"
                );
            }
            if (academicYear.getActiveStatus() != ActiveStatus.ENABLE) {
                throw new OperationNotAllowedException(
                        "Academic year " + academicYear.getName() + " is not enabled"
                );
            }
            if (repository.existsByCourse_IdAndAcademicYear_Id(
                    course.getId(),
                    academicYear.getId()
            )) {
                throw new OperationNotAllowedException(
                        "A fee structure already exists for course " + course.getName()
                                + " in academic year " + academicYear.getName()
                                + ". Only one fee structure per course and academic year is allowed."
                );
            }
        } else {
            if (repository.existsByCourse_IdAndAcademicYear_IdAndIdNot(
                    course.getId(),
                    academicYear.getId(),
                    currentFeeStructureId
            )) {
                throw new OperationNotAllowedException(
                        "Another fee structure already exists for course " + course.getName()
                                + " in academic year " + academicYear.getName()
                );
            }
        }
    }

    private void validateSameUniversity(Course course, AcademicYear academicYear) {
        if (course.getDepartment() == null
                || course.getDepartment().getSchool() == null
                || course.getDepartment().getSchool().getUniversity() == null
                || academicYear.getUniversity() == null) {
            throw new OperationNotAllowedException(
                    "Course and academic year must belong to valid universities"
            );
        }
        Long courseUniversityId = course.getDepartment().getSchool().getUniversity().getId();
        Long yearUniversityId = academicYear.getUniversity().getId();
        if (!Objects.equals(courseUniversityId, yearUniversityId)) {
            throw new OperationNotAllowedException(
                    "Course " + course.getName() + " and academic year " + academicYear.getName()
                            + " belong to different universities"
            );
        }
    }

    private void validateNoEnrolledSpecializationRemoval(
            FeeStructure feeStructure,
            List<Specialization> requestedSpecializations
    ) {
        if (feeStructure.getAcademicYear() == null) {
            return;
        }
        Long academicYearId = feeStructure.getAcademicYear().getId();
        Set<Long> desiredIds = requestedSpecializations.stream()
                .map(Specialization::getId)
                .collect(java.util.stream.Collectors.toSet());

        for (FeeStructureSpecialization existingAssignment : feeStructure.getSpecializationAssignments()) {
            Specialization existingSpec = existingAssignment.getSpecialization();
            if (existingSpec != null && !desiredIds.contains(existingSpec.getId())) {
                boolean hasEnrolledStudentsInYear = existingSpec.getSectionGroups().stream()
                        .filter(sg -> sg.getSection() != null
                                && sg.getSection().getAcademicYear() != null
                                && Objects.equals(sg.getSection().getAcademicYear().getId(), academicYearId))
                        .anyMatch(sg -> sg.getStudentEnrollments() != null && !sg.getStudentEnrollments().isEmpty());

                if (hasEnrolledStudentsInYear) {
                    throw new OperationNotAllowedException(
                            "Cannot remove specialization " + existingSpec.getName()
                                    + " because students are currently enrolled in academic year "
                                    + feeStructure.getAcademicYear().getName()
                    );
                }
            }
        }
    }

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
        if (specializations == null || specializations.isEmpty()) {
            throw new OperationNotAllowedException(
                    "At least one specialization must be mapped to the fee structure for course "
                            + course.getName()
                            + " in academic year "
                            + academicYear.getName()
            );
        }

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

            if (currentFeeStructureId == null
                    && specialization.getActiveStatus() != ActiveStatus.ENABLE) {
                throw new OperationNotAllowedException(
                        "Specialization " + specialization.getName() + " is not enabled"
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
        if (feeStructure == null || feeStructure.getAcademicYear() == null) {
            return List.of();
        }
        Long targetAcademicYearId = feeStructure.getAcademicYear().getId();

        return feeStructure.getSpecializationAssignments().stream()
                .map(FeeStructureSpecialization::getSpecialization)
                .filter(Objects::nonNull)
                .flatMap(specialization ->
                        specialization.getSectionGroups().stream()
                                .filter(sectionGroup ->
                                        sectionGroup.getSection() != null
                                                && sectionGroup.getSection().getAcademicYear() != null
                                                && Objects.equals(
                                                        sectionGroup.getSection().getAcademicYear().getId(),
                                                        targetAcademicYearId
                                                )
                                )
                                .flatMap(sectionGroup ->
                                        sectionGroup.getStudentEnrollments().stream()
                                )
                )
                .distinct()
                .toList();
    }
}
