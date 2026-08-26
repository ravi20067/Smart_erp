package com.Smart.Erp.DTO.CommonAcademic;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class CommonSchoolDTO {
    private Long id ;
    private String name;
    private String code;
}
