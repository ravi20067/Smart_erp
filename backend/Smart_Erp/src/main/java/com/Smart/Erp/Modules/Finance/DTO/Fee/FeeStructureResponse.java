package com.Smart.Erp.Modules.Finance.DTO.Fee;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Finance.Enum.FeeFrequency;
import lombok.Builder;

import java.util.List;

@Builder
public class FeeStructureResponse {
    private Long id;
    private String name ;
    private FeeFrequency frequency;
    private Integer totalNoOfInstallments;
    private List<FeeComponentResponse> feeComponent;
    private List<CommonDTO> specialization;
    private CommonDTO courses;
    private CommonDTO department;
    private CommonDTO school;
    private CommonDTO academicYear;
}
