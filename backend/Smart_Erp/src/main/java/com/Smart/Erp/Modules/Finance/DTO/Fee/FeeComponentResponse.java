package com.Smart.Erp.Modules.Finance.DTO.Fee;

import com.Smart.Erp.Modules.Finance.Enum.FeeCategoryType;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public class FeeComponentResponse {
    private long id;
    private FeeCategoryType feeCategoryType;
    private String componentName;
    private BigDecimal amount;
    private Boolean isMandatory;
    private Boolean isRefundable;
}
