package com.Smart.Erp.DTO.CommonAcademic;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommonDepartmentDTO {
    private Long id;
    private String name;
    private String code;
}
