package com.Smart.Erp.Modules.Academic.DTO.School;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SchoolResponse {
    private Long id;
    private String name;
    private ActiveStatus activeStatus;
    private String code;
    private CommonDTO dean;
}
