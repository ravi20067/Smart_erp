package com.Smart.Erp.Modules.TimeTable.DTO;
import com.Smart.Erp.Modules.TimeTable.Enum.CalendarDayType;
import com.Smart.Erp.Modules.TimeTable.Enum.OperatingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CalendarDayRequest {
    @NotNull
    private LocalDate calendarDate;
    @NotNull
    private CalendarDayType dayType;
    @NotNull
    private OperatingStatus operatingStatus;
    private String title;
    private String description;
    private String holidayReason;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private Long appliedTimetableVersionId;
    private Boolean instructionDay = true;
}
