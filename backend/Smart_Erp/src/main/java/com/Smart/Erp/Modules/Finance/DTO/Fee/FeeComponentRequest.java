package com.Smart.Erp.Modules.Finance.DTO.Fee;

import com.Smart.Erp.Modules.Finance.Enum.FeeCategoryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FeeComponentRequest {
    private FeeCategoryType feeCategoryType;
    private String componentName;
    private BigDecimal amount;
    private Boolean isMandatory;
    private Boolean isRefundable;
}
