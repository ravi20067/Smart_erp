
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

    // --------------------------------------------------
    // GET ALL
    // --------------------------------------------------

    @GetMapping
    public ResponseEntity<List<FeeStructureResponse>> getFeeStructures() {

        return ResponseEntity.ok(
                service.getFeeStructures()
        );
    }

    // --------------------------------------------------
    // CREATE
    // --------------------------------------------------

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
                    "#courseId) && " +
                    "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ACADEMIC_YEAR, " +
                    "#academicYearId)"
    )
    @PostMapping
    public ResponseEntity<FeeStructureResponse> createFeeStructure(
            @RequestParam Long courseId,
            @RequestParam Long academicYearId,
            @RequestBody FeeStructureRequest request
    ) {

        return ResponseEntity.ok(
                service.createFeeStructure(
                        courseId,
                        academicYearId,
                        request
                )
        );
    }

    // --------------------------------------------------
    // UPDATE
    // --------------------------------------------------

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).UPDATE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).FEE_STRUCTURE, " +
                    "#id)"
    )
    @PutMapping
    public ResponseEntity<FeeStructureResponse> updateFeeStructure(
            @RequestParam Long id,
            @RequestBody FeeStructureUpdateRequest request
    ) {

        return ResponseEntity.ok(
                service.updateFeeStructure(id, request)
        );
    }

    // --------------------------------------------------
    // DELETE
    // --------------------------------------------------

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).DELETE, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).FEE_STRUCTURE, " +
                    "#id)"
    )
    @DeleteMapping
    public ResponseEntity<Void> deleteFeeStructure(
            @RequestParam Long id
    ) {

        service.deleteFeeStructure(id);

        return ResponseEntity.noContent().build();
    }

    // --------------------------------------------------
    // ENUMS
    // --------------------------------------------------

    @GetMapping("/enums")
    public ResponseEntity<FeeEnumResponse> getFeeEnums() {

        FeeEnumResponse response = FeeEnumResponse.builder()
                .feeFrequency(FeeFrequency.buildFeeFrequencyEnum())
                .feeComponentType(
                        FeeCategoryType.buildFeeCategoryTypeEnum()
                )
                .build();

        return ResponseEntity.ok(response);
    }

    // --------------------------------------------------
    // AVAILABLE SPECIALIZATION FILTER
    // --------------------------------------------------

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
                    "#courseId) && " +
                    "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).ACADEMIC_YEAR, " +
                    "#academicYearId)"
    )
    @GetMapping("/specialization/filter")
    public ResponseEntity<List<CommonDTO>> getSpecializationFilter(
            @RequestParam Long courseId,
            @RequestParam Long academicYearId
    ) {

        return ResponseEntity.ok(
                service.getSpecializationFilter(
                        courseId,
                        academicYearId
                )
        );
    }

    // --------------------------------------------------
    // ACADEMIC YEAR FILTER
    // --------------------------------------------------

    @PreAuthorize(
            "@authVerifier.can(" +
                    "T(com.Smart.Erp.Modules.User.Enum.PermissionAction).CREATE_CHILD, " +
                    "T(com.Smart.Erp.Modules.User.Enum.ResourceType).COURSE, " +
                    "#courseId)"
    )
    @GetMapping("/academic-year/filter")
    public ResponseEntity<List<CommonDTO>> getAcademicYearFilter(
            @RequestParam Long courseId
    ) {

        return ResponseEntity.ok(
                service.getAcademicYearFilter(courseId)
        );
    }
}
