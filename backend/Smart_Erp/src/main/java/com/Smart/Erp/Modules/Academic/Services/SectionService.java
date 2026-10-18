package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionRequest;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionResponse;
import com.Smart.Erp.Modules.Academic.Repo.SectionGroupRepo;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import com.Smart.Erp.Modules.Academic.Repo.SectionRepo;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

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

    public SectionResponse create(Long courseId, SectionRequest request) {

        Course course = academicCommonService.getCourse(courseId);

        List<Specialization> specializations =
                academicCommonService.getSpecialization(request.getSpecializationId());

        Section section = Section.builder()
                .name(request.getName())
                .capacity(request.getCapacity())
                .course(course)
                .build();

        section.setCodeWithPrefix(request.getCode());

        List<SectionGroup> groups = specializations.stream()
                .map(specialization ->
                {
                    if (specialization.getCourse().getId() != courseId) {
                        throw new OperationNotAllowedException(
                                "Specialization with id : "
                                        + specialization.getId()
                                        + " does not belong to course with id : "
                                        + courseId
                        );
                    }
                    return SectionGroup.builder()
                            .name(request.getName() + "-" + specialization.getName())
                            .code(SectionGroup.mergeForCode(section.getCode(), specialization.getCode()))
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

        if (request.getCapacity() < section.getStudentCount()) {
            throw new OperationNotAllowedException(
                    "Student count is greater than capacity"
            );
        }

        if (nameChanged) {
            section.setName(request.getName());
        }

        section.setCodeWithPrefix(request.getCode());

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

        Set<Long> existingIds = sectionGroups.stream()
                .map(group -> group.getSpecialization().getId())
                .collect(Collectors.toSet());

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
                        .map(specialization ->
                        {
                            if (!Objects.equals(specialization.getCourse().getId(), finalSection.getCourse().getId())) {
                                throw new OperationNotAllowedException(
                                        "Specialization with id : "
                                                + specialization.getId()
                                                + " does not belong to course with id : "
                                                + finalSection.getCourse().getId()
                                );
                            }
                            return SectionGroup.builder()
                                    .name(
                                            request.getName()
                                                    + "-"
                                                    + specialization.getName()
                                    )
                                    .code(SectionGroup.mergeForCode(finalSection.getCode(), specialization.getCode()))
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

    public String getPrefix(Long courseId) {
        return academicCommonService.getCourse(courseId).getCode();
    }
}
