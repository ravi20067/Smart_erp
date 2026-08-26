package com.Smart.Erp.DTO.Admin.School;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SchoolRequest {
    private String name;
    private String code;
    private Long deanId;
}
