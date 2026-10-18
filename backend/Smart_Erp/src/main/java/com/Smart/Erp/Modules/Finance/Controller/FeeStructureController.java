package com.Smart.Erp.Modules.Finance.Controller;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeEnumResponse;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureRequest;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureResponse;
import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeStructureUpdateRequest;
import com.Smart.Erp.Modules.Finance.Enum.FeeCategoryType;
import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import com.Smart.Erp.Modules.Finance.Services.FeeStructureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/{role:admin|dean|school-dean|super-admin}/fee-structures")
@RequiredArgsConstructor
public class FeeStructureController {

    private final FeeStructureService service;

    @GetMapping
    public ResponseEntity<List<FeeStructureResponse>> getFeeStructures() {
        List<FeeStructureResponse> response = service.getFeeStructures();
        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
                    "#courseId)")
    @PostMapping
    public ResponseEntity<FeeStructureResponse> createFeeStructure(
            @RequestParam Long courseId,
            @RequestBody FeeStructureRequest request
            ) {
        FeeStructureResponse response = service.createFeeStructure(courseId, request);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).FEE_STRUCTURE, " +
                    "#id)")
    @PutMapping
    public ResponseEntity<FeeStructureResponse> updateFeeStructure(
            @RequestParam Long id,
            @RequestBody FeeStructureUpdateRequest request
            ) {
        FeeStructureResponse response = service.updateFeeStructure(id, request);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).FEE_STRUCTURE, " +
                    "#id)")
    @DeleteMapping
    public ResponseEntity<Void> deleteFeeStructure(@RequestParam Long id) {
        service.deleteFeeStructure(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/enums")
    public ResponseEntity<FeeEnumResponse> getFeeEnums() {
        FeeEnumResponse response = FeeEnumResponse.builder()
                .feeFrequency(FeeFrequency.buildFeeFrequencyEnum())
                .feeComponentType(FeeCategoryType.buildFeeCategoryTypeEnum())
                .build();

        return ResponseEntity.ok(response);
    }

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
                    "#courseId)")
    @GetMapping("/specialization/filter")
    public ResponseEntity<List<CommonDTO>> getSpecializationFilter(@RequestParam Long courseId) {
        List<CommonDTO> response = service.getSpecializationFilter(courseId);
        return ResponseEntity.ok(response);
    }
}
