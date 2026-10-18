package com.Smart.Erp.Modules.Finance.DTO.Fee;

import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FeeStructureRequest {
    private String name;
    private FeeFrequency frequency;
    private Integer totalNoOfInstallments;
    private List<Long> specializationId;
    List<FeeComponentRequest> components;
}
