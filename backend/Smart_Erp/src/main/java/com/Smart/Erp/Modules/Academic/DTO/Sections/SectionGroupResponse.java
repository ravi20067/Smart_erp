package com.Smart.Erp.Modules.Academic.DTO.Sections;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

@SuperBuilder
@Getter
public class SectionGroupResponse extends BaseDTO {
    private Long id;
    private String name;
    private String code;
    private CommonDTO specialization;
    private Integer studentCount;
}
