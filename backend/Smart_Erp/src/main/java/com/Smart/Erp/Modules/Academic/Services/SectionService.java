package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionRequest;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionResponse;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Academic.Repo.SectionGroupRepo;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Student.DTO.SectionGroupFilter;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Repo.SectionRepo;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class SectionService {
    private final SectionRepo sectionRepo;
    private final AcademicCommonService academicCommonService;
    private final AuthorizationService authorizationService;
    private final SectionGroupRepo sectionGroupRepo;

    public @Nullable List<SectionResponse> getAll() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.SECTION);
        List<Section> sections = sectionRepo.findAllById(map.keySet());
        return sections.stream()
                .map(
                        section -> section.mapToResponse(
                                authorizationService.getPermissionAction(ResourceType.SECTION, section.getId())
                        )
                )
                .toList();
    }

    public SectionResponse create(Long courseId, SectionRequest request, Long academicYearId) {

        Course course = academicCommonService.getCourse(courseId);
        AcademicYear academicYear = academicCommonService.getAcademicYear(academicYearId);

        if (request == null) {
            throw new OperationNotAllowedException("Section request cannot be null");
        }
        if (request.getCapacity() == null || request.getCapacity() < 1) {
            throw new OperationNotAllowedException("Section capacity must be at least 1");
        }
        if (request.getSpecializationId() == null || request.getSpecializationId().isEmpty()) {
            throw new OperationNotAllowedException("At least one specialization is required for a section");
        }

        validateCourseAndAcademicYear(course, academicYear);

        Set<Long> uniqueSpecIds = new LinkedHashSet<>(request.getSpecializationId());
        if (uniqueSpecIds.size() != request.getSpecializationId().size()) {
            throw new OperationNotAllowedException("Duplicate specializations are not allowed in a section");
        }

        List<Specialization> specializations =
                academicCommonService.getSpecialization(new ArrayList<>(uniqueSpecIds));
        if (specializations.size() != uniqueSpecIds.size()) {
            throw new OperationNotAllowedException("One or more specializations do not exist");
        }

        Section section = Section.builder()
                .name(request.getName())
                .capacity(request.getCapacity())
                .academicYear(academicYear)
                .course(course)
                .build();

        section.setCodeWithPrefix(academicYear.getCode().replace(academicYear.getUniversity().getCode(),"") + "-" + course.getCode() + request.getCode());

        List<SectionGroup> groups = specializations.stream()
                .map(specialization -> {
                    validateSpecializationEligibility(specialization, course, academicYear);
                    return SectionGroup.builder()
                            .name(request.getName() + "-" + specialization.getName())
                            .code(section.getCode() + specialization.getCode().replace(section.getCourse().getCode(),""))
                            .specialization(specialization)
                            .section(section)
                            .build();
                })
                .toList();

        section.setSectionGroups(groups);

        Section savedSection = sectionRepo.save(section);
        authorizationService.createPermission(savedSection.getId(), ResourceType.SECTION, courseId, ResourceType.COURSE);

        savedSection.getSectionGroups().forEach(
                group -> authorizationService.createPermission(group.getId(), ResourceType.SECTION_GROUP, savedSection.getId(), ResourceType.SECTION)
        );
        return savedSection.mapToResponse(authorizationService.getPermissionAction(ResourceType.SECTION, savedSection.getId()));
    }

    @Transactional
    public @Nullable SectionResponse update(
            Long sectionId,
            SectionRequest request
    ) {
        Section section = academicCommonService.getSection(sectionId);

        boolean nameChanged = !section.getName().equals(request.getName());

        if (request.getCapacity() == null || request.getCapacity() < section.getStudentCount()) {
            throw new OperationNotAllowedException(
                    "Student count is greater than capacity"
            );
        }

        section.setCapacity(request.getCapacity());

        if (nameChanged) {
            section.setName(request.getName());
        }

        section.setCodeWithPrefix(section.getAcademicYear().getCode().replace(section.getAcademicYear().getUniversity().getCode(),"") + "-" + section.getCourse().getCode() + request.getCode());

        // Capture newly created groups from the helper method
        List<SectionGroup> newlyAddedGroups = handleUpdateSpecialization(section, request, nameChanged);

        // Save to ensure new groups get their IDs generated via Cascade
        Section savedSection = sectionRepo.save(section);


        // Apply permissions to only the new groups
        for (SectionGroup group : newlyAddedGroups) {
            authorizationService.createPermission(
                    group.getId(),
                    ResourceType.SECTION_GROUP,
                    savedSection.getId(),
                    ResourceType.SECTION
            );
        }

        return savedSection.mapToResponse(
                authorizationService.getPermissionAction(ResourceType.SECTION, savedSection.getId())
        );
    }

    private List<SectionGroup> handleUpdateSpecialization(
            Section section,
            SectionRequest request,
            boolean nameChanged
    ) {
        if (section.getActiveStatus() != request.getActiveStatus()) {
            section = academicCommonService.handleActiveStatusUpdate(section, request.getActiveStatus());
        }

        List<SectionGroup> sectionGroups = section.getSectionGroups();
        Set<Long> requestedIds = new HashSet<>(request.getSpecializationId());
        List<Specialization> requestedSpecializations =
                academicCommonService.getSpecialization(new ArrayList<>(requestedIds));

        Set<Long> existingIds = new HashSet<>();
        for (SectionGroup group : sectionGroups) {
            Specialization specialization = group.getSpecialization();
            if (specialization == null) {
                List<Specialization> matches = requestedSpecializations.stream()
                        .filter(candidate ->
                                group.getName() != null
                                        && group.getName().endsWith("-" + candidate.getName())
                        )
                        .toList();
                if (matches.size() != 1) {
                    throw new OperationNotAllowedException(
                            "Section group with id "
                                    + group.getId()
                                    + " has no specialization and cannot be matched uniquely "
                                    + "to the requested specializations"
                    );
                }

                specialization = matches.getFirst();
                if (!Objects.equals(
                        specialization.getCourse().getId(),
                        section.getCourse().getId()
                )) {
                    throw new OperationNotAllowedException(
                            "Specialization with id "
                                    + specialization.getId()
                                    + " does not belong to this section's course"
                    );
                }
                group.setSpecialization(specialization);
            }
            existingIds.add(specialization.getId());
        }

        if (!nameChanged && existingIds.equals(requestedIds)) {
            return Collections.emptyList();
        }

        Iterator<SectionGroup> iterator = sectionGroups.iterator();

        while (iterator.hasNext()) {
            SectionGroup group = iterator.next();
            Long specializationId = group.getSpecialization().getId();

            if (requestedIds.contains(specializationId)) {
                if (nameChanged) {
                    group.setName(
                            request.getName()
                                    + "-"
                                    + group.getSpecialization().getName()
                    );
                }
            } else {
                if (!group.getStudentEnrollments().isEmpty()) {
                    throw new OperationNotAllowedException(
                            "You can't remove specialization from this section : "
                                    + "It carry student specialization"
                    );
                }
                // Delete the permission for the section group
                authorizationService.deletePermission(
                        ResourceType.SECTION_GROUP,
                        group.getId()
                );
                iterator.remove();
            }
        }

        requestedIds.removeAll(existingIds);

        if (requestedIds.isEmpty()) {
            return Collections.emptyList();
        }

        Section finalSection = section;
        List<SectionGroup> newGroups =
                academicCommonService.getSpecialization(new ArrayList<>(requestedIds))
                        .stream()
                        .map(specialization -> {
                            validateSpecializationEligibility(
                                    specialization,
                                    finalSection.getCourse(),
                                    finalSection.getAcademicYear()
                            );
                            return SectionGroup.builder()
                                    .name(
                                            request.getName()
                                                    + "-"
                                                    + specialization.getName()
                                    )
                                    .code(finalSection.getCode() + specialization.getCode().replace(finalSection.getCourse().getCode(),""))
                                    .specialization(specialization)
                                    .section(finalSection)
                                    .build();
                        })
                        .toList();

        sectionGroups.addAll(newGroups);

        return sectionGroupRepo.saveAll(newGroups);
    }

    public @Nullable String delete(Long sectionId) {
        Section section = academicCommonService.getSection(sectionId);
        if (
                section.getSectionGroups().stream()
                        .allMatch(sectionGroup -> sectionGroup.getStudentEnrollments().isEmpty())
        ) {
            sectionRepo.delete(section);
            authorizationService.deletePermission(ResourceType.SECTION, section.getId());
            return "Deleted Successfully";
        } else {
            throw new OperationNotAllowedException("You can't delete this section because it carry students");
        }
    }

    public String getPrefix(Long academicYearId, Long courseId) {
        AcademicYear academicYear = academicCommonService.getAcademicYear(academicYearId);
        return academicYear.getCode().replace(academicYear.getUniversity().getCode(),"") + "-" + academicCommonService.getCourse(courseId).getCode();
    }

    public List<CommonDTO> getAcademicYearFilter(Long courseId) {
        return academicCommonService.getCourse(courseId).getDepartment().getSchool().getUniversity().getAcademicYears()
                .stream()
                .filter(academicYear ->
                        academicYear.getActiveStatus() == ActiveStatus.ENABLE
                                && authorizationService.can(PermissionAction.CREATE_CHILD, ResourceType.ACADEMIC_YEAR, academicYear.getId()))
                .map(CommonReference::toCommonDTO)
                .toList();
    }

    /**
     * Returns enabled specializations of a course that have a mapped fee structure in the selected academic year.
     */
    public List<CommonDTO> getSpecializationFilter(Long courseId, Long academicYearId) {
        Course course = academicCommonService.getCourse(courseId);
        AcademicYear academicYear = academicCommonService.getAcademicYear(academicYearId);
        validateCourseAndAcademicYear(course, academicYear);

        return course.getSpecializations().stream()
                .filter(spec -> spec.getActiveStatus() == ActiveStatus.ENABLE
                        && hasValidFeeStructure(spec, course, academicYear))
                .map(Specialization::toCommonDTO)
                .toList();
    }

    /**
     * Returns section groups eligible for the given specialization and academic year with a valid mapped fee structure.
     */
    public List<SectionGroupFilter> getEligibleSectionGroups(Long specializationId, Long academicYearId) {
        return academicCommonService.filterSectionGroupForSectionPage(specializationId, academicYearId);
    }

    private void validateCourseAndAcademicYear(Course course, AcademicYear academicYear) {
        if (course == null || academicYear == null) {
            throw new OperationNotAllowedException("Course and academic year are required");
        }
        if (course.getActiveStatus() != ActiveStatus.ENABLE) {
            throw new OperationNotAllowedException("Course " + course.getName() + " is not enabled");
        }
        if (academicYear.getActiveStatus() != ActiveStatus.ENABLE) {
            throw new OperationNotAllowedException("Academic year " + academicYear.getName() + " is not enabled");
        }
        Long courseUniversityId = course.getDepartment() != null
                && course.getDepartment().getSchool() != null
                && course.getDepartment().getSchool().getUniversity() != null
                ? course.getDepartment().getSchool().getUniversity().getId()
                : null;
        Long yearUniversityId = academicYear.getUniversity() != null
                ? academicYear.getUniversity().getId()
                : null;
        if (courseUniversityId == null || !Objects.equals(courseUniversityId, yearUniversityId)) {
            throw new OperationNotAllowedException(
                    "Course " + course.getName() + " and academic year " + academicYear.getName()
                            + " belong to different universities"
            );
        }
    }

    private void validateSpecializationEligibility(
            Specialization specialization,
            Course course,
            AcademicYear academicYear
    ) {
        if (specialization.getCourse() == null
                || !Objects.equals(specialization.getCourse().getId(), course.getId())) {
            throw new OperationNotAllowedException(
                    "Specialization " + specialization.getName()
                            + " does not belong to course " + course.getName()
            );
        }
        if (specialization.getActiveStatus() != ActiveStatus.ENABLE) {
            throw new OperationNotAllowedException(
                    "Specialization " + specialization.getName() + " is not enabled"
            );
        }
        if (!hasValidFeeStructure(specialization, course, academicYear)) {
            throw new OperationNotAllowedException(
                    "Specialization " + specialization.getName()
                            + " does not have a valid mapped fee structure for academic year "
                            + academicYear.getName()
            );
        }
    }

    private boolean hasValidFeeStructure(
            Specialization specialization,
            Course course,
            AcademicYear academicYear
    ) {
        FeeStructure mapped = specialization.getFeeStructure(academicYear);
        return mapped != null
                && mapped.getCourse() != null
                && Objects.equals(mapped.getCourse().getId(), course.getId())
                && mapped.getAcademicYear() != null
                && Objects.equals(mapped.getAcademicYear().getId(), academicYear.getId());
    }
}
