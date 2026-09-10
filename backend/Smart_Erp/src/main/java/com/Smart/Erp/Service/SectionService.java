package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.Admin.Sections.SectionRequest;
import com.Smart.Erp.DTO.Admin.Sections.SectionResponse;
import com.Smart.Erp.Entity.*;
import com.Smart.Erp.Enum.Role;
import com.Smart.Erp.Exception.OperationNotAllowedException;
import com.Smart.Erp.Repository.SectionGroupRepo;
import com.Smart.Erp.Repository.SectionRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SectionService {
    private final SectionRepo sectionRepo;
    private final CommonService commonService;
    private final MappingService mappingService;

    public @Nullable List<SectionResponse> getAll(Long courseId) {
        return commonService.getCourse(courseId).getSections().stream()
                .map(mappingService::mapToResponse)
                .toList();
    }

    public @Nullable SectionResponse getById(Long courseId, Long sectionId) {
        return mappingService.mapToResponse(validate(courseId, commonService.getSection(sectionId)));
    }

    @Transactional
    public SectionResponse create(Long courseId, SectionRequest request) {

        Course course = commonService.getCourse(courseId);

        Teacher mentor = commonService.updateTeacherRole(
                new Teacher(),
                request.getMentorId(),
                Role.MENTOR
        );

        List<Specialization> specializations =
                commonService.getSpecialization(request.getSpecializationId());

        Section section = Section.builder()
                .name(request.getName())
                .code(request.getCode())
                .capacity(request.getCapacity())
                .studentCount(0)
                .mentor(mentor)
                .course(course)
                .build();

        List<SectionGroup> groups = specializations.stream()
                .map(specialization -> SectionGroup.builder()
                        .name(request.getName() + "-" + specialization.getName())
                        .specialization(specialization)
                        .section(section)
                        .build())
                .toList();

        section.setSectionGroups(groups);

        sectionRepo.save(section);

        return mappingService.mapToResponse(section);
    }
    @Transactional
    public @Nullable SectionResponse update(
            Long courseId,
            Long sectionId,
            SectionRequest request
    ) {
        Section section = validate(courseId, commonService.getSection(sectionId));

        boolean nameChanged = !section.getName().equals(request.getName());

        if (request.getCapacity() < section.getStudentCount()) {
            throw new OperationNotAllowedException(
                    "Student count is greater than capacity"
            );
        }

        if (nameChanged) {
            section.setName(request.getName());
        }

        section.setCode(request.getCode());

        handleUpdateSpecialization(section, request, nameChanged);

        section.setMentor(
                commonService.updateTeacherRole(
                        section.getMentor(),
                        request.getMentorId(),
                        Role.MENTOR
                )
        );

        return mappingService.mapToResponse(sectionRepo.save(section));
    }

    private void handleUpdateSpecialization(
            Section section,
            SectionRequest request,
            boolean nameChanged
    ) {
        List<SectionGroup> sectionGroups = section.getSectionGroups();

        Set<Long> requestedIds =
                new HashSet<>(request.getSpecializationId());

        Set<Long> existingIds = sectionGroups.stream()
                .map(group -> group.getSpecialization().getId())
                .collect(Collectors.toSet());

        if (!nameChanged && existingIds.equals(requestedIds)) {
            return;
        }
        for (SectionGroup group : sectionGroups) {

            Long specializationId =
                    group.getSpecialization().getId();

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
            }
        }

        requestedIds.removeAll(existingIds);

        if (requestedIds.isEmpty()) {
            return;
        }

        List<SectionGroup> newGroups =
                commonService.getSpecialization(new ArrayList<>(requestedIds))
                        .stream()
                        .map(specialization ->
                                SectionGroup.builder()
                                        .name(
                                                request.getName()
                                                        + "-"
                                                        + specialization.getName()
                                        )
                                        .specialization(specialization)
                                        .section(section)
                                        .build()
                        )
                        .toList();

        sectionGroups.addAll(newGroups);
    }

    public @Nullable String delete(Long sectionId, Long courseId) {
        Section section = validate(courseId,commonService.getSection(sectionId));
        if (
                section.getSectionGroups().stream()
                        .allMatch(sectionGroup -> sectionGroup.getStudentEnrollments().isEmpty())
        ){
            sectionRepo.delete(section);
            return "Deleted Successfully";
        } else {
            throw new OperationNotAllowedException("You can't delete this section because it carry students");
        }
    }

    private Section validate(Long courseId, Section section) {
        if (Objects.equals(section.getCourse().getId(), courseId)) {
            return section;
        } else {
            throw new OperationNotAllowedException("Course id is not valid for this section");
        }
    }
}
