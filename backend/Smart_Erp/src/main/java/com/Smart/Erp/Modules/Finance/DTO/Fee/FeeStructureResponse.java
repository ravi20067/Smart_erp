package com.Smart.Erp.Modules.Finance.DTO.Fee;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.*;

import java.util.List;

import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class FeeStructureResponse extends BaseDTO {
    private Long id;
    private String name ;
    private FeeFrequency frequency;
    private Integer totalNoOfInstallments;
    private List<FeeComponentResponse> feeComponent;
    private List<CommonDTO> specialization;
    private CommonDTO courses;
    private CommonDTO department;
    private CommonDTO school;
    private CommonDTO university;
    private CommonDTO academicYear;
    private List<PermissionAction> permissionActions;
}

