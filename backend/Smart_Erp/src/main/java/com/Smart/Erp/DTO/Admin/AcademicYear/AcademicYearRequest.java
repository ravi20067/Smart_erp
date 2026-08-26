package com.Smart.Erp.DTO.Admin.AcademicYear;

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
