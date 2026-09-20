package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionRequest;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionResponse;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Services.TeacherCommonService;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import com.Smart.Erp.Modules.Academic.Repo.SectionRepo;
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
    private final AcademicCommonService academicCommonService;
    private final TeacherCommonService teacherCommonService;

    public @Nullable List<SectionResponse> getAll(Long academicYearId, Long schoolId, Long departmentId, Long courseId) {
        if (courseId != null) {
            return academicCommonService.getCourse(courseId).getSections().stream()
                    .map(Section::mapToResponse)
                    .toList();
        } else if (departmentId != null) {
            return academicCommonService.getDepartment(departmentId).getCourses().stream()
                    .flatMap(course -> course.getSections().stream())
                    .map(Section::mapToResponse)
                    .toList();
        } else if (schoolId != null) {
            return academicCommonService.getSchool(schoolId).getDepartments().stream()
                    .flatMap(department -> department.getCourses().stream())
                    .flatMap(course -> course.getSections().stream())
                    .map(Section::mapToResponse)
                    .toList();
        } else {
            return academicCommonService.getAcademicYear(academicYearId).getSchools().stream()
                    .flatMap(school -> school.getDepartments().stream())
                    .flatMap(department -> department.getCourses().stream())
                    .flatMap(course -> course.getSections().stream())
                    .map(Section::mapToResponse)
                    .toList();
        }
    }

    public @Nullable SectionResponse getById(Long courseId, Long sectionId) {
        return validate(courseId, academicCommonService.getSection(sectionId)).mapToResponse();
    }

    @Transactional
    public SectionResponse create(Long courseId, SectionRequest request) {

        Course course = academicCommonService.getCourse(courseId);

        Teacher mentor = teacherCommonService.updateTeacherRole(
                new Teacher(),
                request.getMentorId(),
                UserRoles.MENTOR
        );

        List<Specialization> specializations =
                academicCommonService.getSpecialization(request.getSpecializationId());

        Section section = Section.builder()
                .name(request.getName())
                .code(request.getCode())
                .capacity(request.getCapacity())
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

        return sectionRepo.save(section).mapToResponse();
    }
    @Transactional
    public @Nullable SectionResponse update(
            Long courseId,
            Long sectionId,
            SectionRequest request
    ) {
        Section section = validate(courseId, academicCommonService.getSection(sectionId));

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
                teacherCommonService.updateTeacherRole(
                        section.getMentor(),
                        request.getMentorId(),
                        UserRoles.MENTOR
                )
        );

        return sectionRepo.save(section).mapToResponse();
    }

    private void handleUpdateSpecialization(
            Section section,
            SectionRequest request,
            boolean nameChanged
    ) {
        if (section.getActiveStatus() != request.getActiveStatus()){
            section = academicCommonService.handleActiveStatusUpdate(section, request.getActiveStatus());
        }

        List<SectionGroup> sectionGroups = section.getSectionGroups();

        Set<Long> requestedIds = new HashSet<>(request.getSpecializationId());

        Set<Long> existingIds = sectionGroups.stream()
                .map(group -> group.getSpecialization().getId())
                .collect(Collectors.toSet());

        if (!nameChanged && existingIds.equals(requestedIds)) {
            return;
        }
        // CHANGED: Using Iterator to allow safe removal during traversal
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
                // CHANGED: Actually remove the group from the sectionGroups list
                iterator.remove();
            }
        }

        requestedIds.removeAll(existingIds);

        if (requestedIds.isEmpty()) {
            return;
        }

        Section finalSection = section;
        List<SectionGroup> newGroups =
                academicCommonService.getSpecialization(new ArrayList<>(requestedIds))
                        .stream()
                        .map(specialization ->
                                SectionGroup.builder()
                                        .name(
                                                request.getName()
                                                        + "-"
                                                        + specialization.getName()
                                        )
                                        .specialization(specialization)
                                        .section(finalSection)
                                        .build()
                        )
                        .toList();

        sectionGroups.addAll(newGroups);
    }

    public @Nullable String delete(Long sectionId, Long courseId) {
        Section section = validate(courseId, academicCommonService.getSection(sectionId));
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
