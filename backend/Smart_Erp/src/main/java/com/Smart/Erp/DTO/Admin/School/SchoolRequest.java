package com.Smart.Erp.DTO.Admin.School;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchoolRequest {
    private String name;
    private String code;
    private Long deanId;
}
