package com.Smart.Erp.DTO.Admin.Specialization;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SpecializationRequest {
    private Long id;
    private String name;
    private String code;
}
