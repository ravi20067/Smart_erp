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
    private final AcademicMappingService mappingService;

    public @Nullable List<SpecializationResponse> getAll(Long courseId) {
        return academicCommonService.getCourse(courseId).getSpecializations().stream()
                .map(mappingService::mapToResponse)
                .toList();
    }

    public @Nullable SpecializationResponse getById(Long courseId, Long specializationId) {
        return mappingService.mapToResponse(validate(academicCommonService.getSpecialization(specializationId),courseId));
    }

    public @Nullable SpecializationResponse create(Long courseId, CommonRequest request) {
        Course course = academicCommonService.getCourse(courseId);
        return mappingService.mapToResponse(
                specializationRepo.save(
                        Specialization.builder()
                                .name(request.getName())
                                .code(request.getCode())
                                .course(course)
                                .build()
                )
        );
    }
    public @Nullable SpecializationResponse update(Long courseId, SpecializationRequest request) {
        Specialization specialization = academicCommonService.getSpecialization(request.getId());

        specialization.setName(request.getName());
        specialization.setCode(request.getCode());

        return mappingService.mapToResponse(specializationRepo.save(specialization));
    }
    public @Nullable String delete(Long specializationId, Long courseId) {
        Specialization specialization = academicCommonService.getSpecialization(specializationId);
        if (specialization.getSubjects().isEmpty() && specialization.getSectionGroups().isEmpty()){
            specializationRepo.delete(specialization);
            return "Deleted Successfully";
        }
        return null;
    }
    public Specialization validate(Specialization specialization ,Long courseId){
        if (specialization.getCourse().getId().equals(courseId)){
            return specialization;
        }else {
            throw new OperationNotAllowedException("Course Id is not valid");
        }
    }
}
