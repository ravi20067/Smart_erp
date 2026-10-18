package com.Smart.Erp.Modules.Finance.DTO.Scholarship;

import com.Smart.Erp.Modules.Finance.Enum.AmountType;
import com.Smart.Erp.Modules.Finance.Enum.ScholarshipType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ScholarshipRequest {
    private String name;
    private String code;
    private String description;
    private BigDecimal number;
    private Boolean status;
    private AmountType amountType;
    private ScholarshipType scholarshipType;
}
