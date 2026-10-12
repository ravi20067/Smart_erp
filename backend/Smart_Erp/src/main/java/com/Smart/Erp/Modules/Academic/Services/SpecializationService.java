package com.Smart.Erp.Modules.Academic.Services;

import com.Smart.Erp.Modules.Academic.DTO.Specialization.SpecializationRequest;
import com.Smart.Erp.Modules.Academic.DTO.Specialization.SpecializationResponse;
import com.Smart.Erp.Core.Common.CommonRequest;
import com.Smart.Erp.Modules.Academic.Entity.Course;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Repo.SpecializationRepo;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;


@Service
@RequiredArgsConstructor
@Transactional
public class SpecializationService {
    private final SpecializationRepo specializationRepo;
    private final AcademicCommonService academicCommonService;
    private final AuthorizationService authorizationService;

    public @Nullable List<SpecializationResponse> getAll() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.SPECIALIZATION);
        List<Specialization> specializations = specializationRepo.findAllById(map.keySet());
        return specializations.stream()
                .map(specialization -> specialization.mapToResponse(authorizationService.getPermissionAction(ResourceType.SPECIALIZATION, specialization.getId())))
                .toList();
    }

    public @Nullable SpecializationResponse create(Long courseId, CommonRequest request) {
        Course course = academicCommonService.getCourse(courseId);

        Specialization build = Specialization.builder()
                .name(request.getName())
                .code(course.getCode() + request.getCode())
                .course(course)
                .build();

        build = specializationRepo.save(build);
        authorizationService.createPermission(build.getId(), ResourceType.SPECIALIZATION, courseId, ResourceType.COURSE);
        return build.mapToResponse(authorizationService.getPermissionAction(ResourceType.SPECIALIZATION, build.getId()));
    }

    public @Nullable SpecializationResponse update(SpecializationRequest request) {
        Specialization specialization = academicCommonService.getSpecialization(request.getId());

        specialization.setName(request.getName());
        specialization.setCodeWithPrefix(request.getCode());
        if (specialization.getActiveStatus() != request.getActiveStatus()){
            specialization = academicCommonService.handleActiveStatusUpdate(specialization,request.getActiveStatus());
        }

        return specializationRepo.save(specialization).mapToResponse(authorizationService.getPermissionAction(ResourceType.SPECIALIZATION, specialization.getId()));
    }
    public @Nullable String delete(Long specializationId) {
        Specialization specialization = academicCommonService.getSpecialization(specializationId);
        if (specialization.getSubjects().isEmpty() && specialization.getSectionGroups().isEmpty()){
            specializationRepo.delete(specialization);
            authorizationService.deletePermission( ResourceType.SPECIALIZATION , specialization.getId());
            return "Deleted Successfully";
        }
        throw new OperationNotAllowedException("Remove its subjects and section");
    }

    public String getPrefix(Long courseId) {
        return academicCommonService.getCourse(courseId).getCode();
    }
}
