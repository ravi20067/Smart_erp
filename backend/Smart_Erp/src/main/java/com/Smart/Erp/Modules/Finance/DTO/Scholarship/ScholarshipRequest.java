package com.Smart.Erp.Modules.Finance.DTO.Scholarship;

import com.Smart.Erp.Modules.Finance.Enum.AmountType;
import com.Smart.Erp.Modules.Finance.Enum.ScholarshipType;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@AllArgsConstructor
@NoArgsConstructor
public class ScholarshipRequest {
    private String name;
    private String code;
    private String description;
    private BigDecimal number;
    private AmountType amountType;
    private ScholarshipType scholarshipType;
}
