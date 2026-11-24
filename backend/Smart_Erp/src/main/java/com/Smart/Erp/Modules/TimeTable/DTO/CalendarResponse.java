package com.Smart.Erp.Modules.TimeTable.DTO;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Modules.TimeTable.Enum.CalendarStatus;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;

@SuperBuilder
@Getter
public class CalendarResponse extends BaseDTO {
    private Long id;
    private Long sectionId;
    private Long academicYearId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime defaultOpeningTime;
    private LocalTime defaultClosingTime;
    private CalendarStatus status;
}