package com.Smart.Erp.DTO.Admin.AcademicYear;

import com.Smart.Erp.DTO.Admin.School.SchoolResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Builder
@Data
public class AcademicYearResponse {
    private Long id;
    private String name;
    private String code;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean current = false;
    private Boolean active = true;
    private List<SchoolResponse> schoolResponse;
}
