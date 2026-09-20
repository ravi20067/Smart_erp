package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.Specialization.SpecializationRequest;
import com.Smart.Erp.Modules.Academic.DTO.Specialization.SpecializationResponse;
import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Repo.SpecializationRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional
public class SpecializationService {
    private final SpecializationRepo specializationRepo;
    private final AcademicCommonService academicCommonService;

    public @Nullable List<SpecializationResponse> getAll(Long academicYearId, Long schoolId, Long departmentId, Long courseId) {
        if (courseId != null) {
            return academicCommonService.getCourse(courseId).getSpecializations().stream()
                    .map(Specialization::mapToResponse)
                    .toList();
        } else if (departmentId != null) {
            return academicCommonService.getDepartment(departmentId).getCourses().stream()
                    .flatMap(course -> course.getSpecializations().stream())
                    .map(Specialization::mapToResponse)
                    .toList();
        } else if (schoolId != null) {
            return academicCommonService.getSchool(schoolId).getDepartments().stream()
                    .flatMap(department -> department.getCourses().stream())
                    .flatMap(course -> course.getSpecializations().stream())
                    .map(Specialization::mapToResponse)
                    .toList();
        }
        return academicCommonService.getAcademicYear(academicYearId).getSchools().stream()
                .flatMap(school -> school.getDepartments().stream())
                .flatMap(department -> department.getCourses().stream())
                .flatMap(course -> course.getSpecializations().stream())
                .map(Specialization::mapToResponse)
                .toList();
    }

    public @Nullable SpecializationResponse getById(Long courseId, Long specializationId) {
        return validate(academicCommonService.getSpecialization(specializationId),courseId).mapToResponse();
    }

    public @Nullable SpecializationResponse create(Long courseId, CommonRequest request) {
        Course course = academicCommonService.getCourse(courseId);
        return specializationRepo.save(
                Specialization.builder()
                        .name(request.getName())
                        .code(request.getCode())
                        .course(course)
                        .build()
        ).mapToResponse();
    }
    public @Nullable SpecializationResponse update(Long courseId, SpecializationRequest request) {
        Specialization specialization = academicCommonService.getSpecialization(request.getId());

        specialization.setName(request.getName());
        specialization.setCode(request.getCode());
        if (specialization.getActiveStatus() != request.getActiveStatus()){
            specialization = academicCommonService.handleActiveStatusUpdate(specialization,request.getActiveStatus());
        }

        return specializationRepo.save(specialization).mapToResponse();
    }
    public @Nullable String delete(Long specializationId, Long courseId) {
        Specialization specialization = academicCommonService.getSpecialization(specializationId);
        if (specialization.getSubjects().isEmpty() && specialization.getSectionGroups().isEmpty()){
            specializationRepo.delete(specialization);
            return "Deleted Successfully";
        }
        throw new OperationNotAllowedException("Remove its subjects and section");
    }
    public Specialization validate(Specialization specialization ,Long courseId){
        if (specialization.getCourse().getId().equals(courseId)){
            return specialization;
        }else {
            throw new OperationNotAllowedException("Course Id is not valid");
        }
    }
}
