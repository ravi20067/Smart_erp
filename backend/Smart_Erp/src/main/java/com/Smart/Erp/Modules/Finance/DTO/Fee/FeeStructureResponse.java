package com.Smart.Erp.Modules.Finance.DTO.Fee;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;

import java.util.List;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FeeStructureResponse {
    private Long id;
    private String name ;
    private FeeFrequency frequency;
    private Integer totalNoOfInstallments;
    private List<FeeComponentResponse> feeComponent;
    private List<CommonDTO> specialization;
    private CommonDTO courses;
    private CommonDTO department;
    private CommonDTO school;
    private CommonDTO academicYear;
    private CommonDTO lastModifiedBy;
    private List<PermissionAction> permissionActions;
}

