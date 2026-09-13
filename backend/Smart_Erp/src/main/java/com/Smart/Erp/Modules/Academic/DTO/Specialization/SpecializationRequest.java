package com.Smart.Erp.Modules.Academic.DTO.Specialization;

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
