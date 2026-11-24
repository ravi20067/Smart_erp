package com.Smart.Erp.Modules.Finance.DTO.Scholarship;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Finance.Enum.AmountType;
import com.Smart.Erp.Modules.Finance.Enum.ScholarshipType;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.List;

@Getter
@SuperBuilder
public class ScholarshipResponse extends BaseDTO {
    private Long id;
    private String name;
    private String code;
    private String description;
    private BigDecimal number;
    private AmountType amountType;
    private ScholarshipType scholarshipType;
    private Boolean status;
    private CommonDTO university;
    private List<PermissionAction> permissionActions;
}