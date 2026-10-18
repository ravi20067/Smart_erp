package com.Smart.Erp.Modules.Finance.DTO.Scholarship;

import com.Smart.Erp.Modules.Finance.Enum.AmountType;
import com.Smart.Erp.Modules.Finance.Enum.ScholarshipType;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ScholarshipResponse {
    private Long id;
    private String name;
    private String code;
    private String description;
    private BigDecimal number;
    private AmountType amountType;
    private ScholarshipType scholarshipType;
    private Boolean status;
    private List<PermissionAction> permissionActions;
}