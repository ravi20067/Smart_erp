package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.Admin.Courses.CourseRequest;
import com.Smart.Erp.DTO.Admin.Specialization.SpecializationRequest;
import com.Smart.Erp.DTO.Admin.Specialization.SpecializationResponse;
import com.Smart.Erp.DTO.CommonRequest;
import com.Smart.Erp.Entity.Course;
import com.Smart.Erp.Entity.Specialization;
import com.Smart.Erp.Exception.OperationNotAllowedException;
import com.Smart.Erp.Repository.SpecializationRepo;
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
    private final CommonService commonService;
    private final MappingService mappingService;

    public @Nullable List<SpecializationResponse> getAll(Long courseId) {
        return commonService.getCourse(courseId).getSpecializations().stream()
                .map(mappingService::mapToResponse)
                .toList();
    }

    public @Nullable SpecializationResponse getById(Long courseId, Long specializationId) {
        return mappingService.mapToResponse(validate(commonService.getSpecialization(specializationId),courseId));
    }

    public @Nullable SpecializationResponse create(Long courseId, CommonRequest request) {
        Course course = commonService.getCourse(courseId);
        return mappingService.mapToResponse(
                specializationRepo.save(
                        Specialization.builder()
                                .name(request.getName())
                                .code(course.getCode() + request.getCode())
                                .course(course)
                                .build()
                )
        );
    }
    public @Nullable SpecializationResponse update(Long courseId, SpecializationRequest request) {
        Specialization specialization = commonService.getSpecialization(request.getId());

        specialization.setName(request.getName());
        specialization.setCode(specialization.getCourse().getCode()+ request.getCode());

        return mappingService.mapToResponse(specializationRepo.save(specialization));
    }
    public @Nullable String delete(Long specializationId, Long courseId) {
        Specialization specialization = commonService.getSpecialization(specializationId);
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
