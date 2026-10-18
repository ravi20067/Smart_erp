package com.Smart.Erp.Modules.Finance.Services;

import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
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
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@AllArgsConstructor
public class FeeStructureService {

    private final FeeStructureRepo repository;
    private final AuthorizationService authorizationService;
    private final AcademicCommonService academicCommonService;
    private final AccountCommonService accountCommonService;
    private final FeeComponentRepo feeComponentRepo;

    public List<FeeStructureResponse> getFeeStructures() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.FEE_STRUCTURE);
        List<FeeStructure> feeStructures = repository.findAllById(map.keySet());

        return feeStructures.stream()
                .map(feeStructure -> feeStructure.mapToResponse(map.get(feeStructure.getId())))
                .toList();
    }

    public FeeStructureResponse createFeeStructure(Long courseId, FeeStructureRequest request) {
        Course course = academicCommonService.getCourse(courseId);
        List<Specialization> specializations = academicCommonService.getSpecialization(request.getSpecializationId());
        FeeStructure feeStructure = FeeStructure.createFromRequest(request, course, specializations, authorizationService.getCurrentUser());
        feeStructure = repository.save(feeStructure);
        authorizationService.createPermission(feeStructure.getId(), ResourceType.FEE_STRUCTURE,courseId,ResourceType.COURSE);

        return feeStructure.mapToResponse(authorizationService.getPermissionAction(ResourceType.FEE_STRUCTURE, feeStructure.getId()));
    }

    @Transactional
    public FeeStructureResponse updateFeeStructure(
            Long id,
            FeeStructureUpdateRequest request
    ) {
        // 1. Load the existing fee structure.
        FeeStructure feeStructure =
                accountCommonService.getFeeStructure(id);

        // 2. Resolve the requested specializations.
        List<Specialization> specializations =
                academicCommonService.getSpecialization(
                        request.getSpecializationId()
                );

        if (specializations == null) {
            specializations = List.of();
        }

        // Prevent duplicate specialization IDs in the request.
        Set<Long> specializationIds = new HashSet<>();

        for (Specialization specialization : specializations) {
            if (!specializationIds.add(specialization.getId())) {
                throw new OperationNotAllowedException("Duplicate specialization ID: "
                        + specialization.getId());
            }
        }

        // 3. Resolve the components to remove.
        List<Long> componentIds = request.getComponentToRemove();

        if (componentIds == null) {
            componentIds = List.of();
        }

        if (new HashSet<>(componentIds).size() != componentIds.size()) {
            throw new OperationNotAllowedException("Duplicate fee component IDs in removal request");
        }

        List<FeeComponent> componentsToRemove =
                feeComponentRepo.findAllById(componentIds);

        // Do not silently ignore nonexistent component IDs.
        if (componentsToRemove.size() != componentIds.size()) {
            throw new OperationNotAllowedException("One or more fee components do not exist");
        }

        // 4. Ensure every component belongs to this fee structure.
        for (FeeComponent component : componentsToRemove) {
            if (component.getFeeStructure() == null
                    || !id.equals(
                    component.getFeeStructure().getId()
            )) {
                throw new OperationNotAllowedException(
                        "Fee component " + component.getId()
                                + " does not belong to fee structure "
                                + id
                );
            }
        }

        // 5. Update the entity and its relationships.
        User currentUser = authorizationService.getCurrentUser();

        feeStructure.updateFromRequest(
                request,
                specializations,
                currentUser,
                componentsToRemove
        );

        // 6. Persist the changes.
        FeeStructure updatedFeeStructure =
                repository.save(feeStructure);

        // 7. Return the updated response with permissions.
        return updatedFeeStructure.mapToResponse(
                authorizationService.getPermissionAction(
                        ResourceType.FEE_STRUCTURE,
                        updatedFeeStructure.getId()
                )
        );
    }

    public void deleteFeeStructure(Long id) {
        repository.deleteById(id);
        authorizationService.deletePermission(ResourceType.FEE_STRUCTURE,id);
    }

    public List<CommonDTO> getSpecializationFilter(Long courseId) {
        return academicCommonService.getCourse(courseId).getSpecializations().stream()
                .map(CommonReference::toCommonDTO)
                .toList();
    }
}
