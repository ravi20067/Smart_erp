package com.Smart.Erp.Modules.TimeTable.DTO;

import com.Smart.Erp.Modules.TimeTable.Enum.CalendarDayType;
import com.Smart.Erp.Modules.TimeTable.Enum.OperatingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarDayResponse {
    private Long id;
    private Long calendarId;
    private Long appliedTimetableVersionId;
    private LocalDate calendarDate;
    private CalendarDayType dayType;
    private OperatingStatus operatingStatus;
    private String title;
    private String description;
    private String holidayReason;
    private LocalTime openingTime;
    private LocalTime closingTime;
    private Boolean instructionDay;
}