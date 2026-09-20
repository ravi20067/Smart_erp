package com.Smart.Erp.Modules.Finance.DTO.Fee;

import com.Smart.Erp.Modules.Finance.Enum.FeeCategoryType;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@AllArgsConstructor
@NoArgsConstructor
public class FeeComponentRequest {
    private FeeCategoryType feeCategoryType;
    private String componentName;
    private BigDecimal amount;
    private Boolean isMandatory;
    private Boolean isRefundable;
}
