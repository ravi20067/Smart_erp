package com.Smart.Erp.Modules.Finance.DTO.Fee;

import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import lombok.Builder;

@Builder
public class FeeStructureRequest {
    private Long feeStructureId;
    private String name;
    private FeeFrequency frequency;
    private Integer totalNoOfInstallments;
    private long specializationId;
}
