package com.Smart.Erp.Modules.Academic.DTO.AcademicYear;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class AcademicYearRequest {
    private String name;
    private String code;
    private Boolean active;
    private LocalDate startDate;
    private LocalDate endDate;
}
