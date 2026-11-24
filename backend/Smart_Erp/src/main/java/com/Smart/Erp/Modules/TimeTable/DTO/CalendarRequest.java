package com.Smart.Erp.Modules.TimeTable.DTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CalendarRequest {
    @NotBlank
    private String name;
    @NotNull
    private Long sectionId;
    @NotNull
    private Long academicYearId;
    @NotNull
    private LocalDate startDate;
    @NotNull
    private LocalDate endDate;
    private LocalTime defaultOpeningTime;
    private LocalTime defaultClosingTime;
}
