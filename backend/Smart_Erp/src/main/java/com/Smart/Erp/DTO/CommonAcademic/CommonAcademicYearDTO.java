package com.Smart.Erp.DTO.CommonAcademic;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class CommonAcademicYearDTO {
    private Long id;
    private String name;
    private Boolean current;
}