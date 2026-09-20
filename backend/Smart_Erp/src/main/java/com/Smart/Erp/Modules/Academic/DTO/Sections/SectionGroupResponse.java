package com.Smart.Erp.Modules.Academic.DTO.Sections;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class SectionGroupResponse {
    private Long id;
    private String name;
    private String code;
    private ActiveStatus activeStatus;
    private CommonDTO specialization;
    private Integer studentCount;
}
