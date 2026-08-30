package com.Smart.Erp.DTO.Admin.School;

import com.Smart.Erp.DTO.CommonDTO;
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
