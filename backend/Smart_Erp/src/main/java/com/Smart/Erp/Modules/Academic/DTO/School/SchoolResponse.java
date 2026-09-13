package com.Smart.Erp.Modules.Academic.DTO.School;

import com.Smart.Erp.Core.Common.CommonDTO;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SchoolResponse {
    private Long id;
    private String name;
    private String code;
    private CommonDTO dean;
}
