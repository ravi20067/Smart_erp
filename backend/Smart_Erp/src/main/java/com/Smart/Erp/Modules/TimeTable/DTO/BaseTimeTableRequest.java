package com.Smart.Erp.Modules.TimeTable.DTO;
import com.Smart.Erp.Modules.TimeTable.Enum.BasePeriodType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;

@Data
public class BaseTimeTableRequest {
    @NotBlank
    private String name;
    private String description;
    @NotNull
    private Long schoolId;
    @NotNull
    private LocalTime dayStartTime;
    @NotNull
    private LocalTime dayEndTime;
    @NotNull
    @Min(1)
    private Integer periodsPerDay;
    @NotNull
    @Min(1)
    private Integer defaultPeriodDurationMinutes;
    private Integer defaultBreakDurationMinutes;
    private LocalTime assemblyStartTime;
    private LocalTime assemblyEndTime;
    private Boolean active = true;
    @Valid
    @NotEmpty
    private List<PeriodRequest> periods;

    @Data
    public static class PeriodRequest {
        @NotNull
        @Min(1)
        private Integer sequenceNumber;
        private Integer periodNumber;
        @NotNull
        private BasePeriodType periodType;
        @NotBlank
        private String label;
        @NotNull
        private LocalTime startTime;
        @NotNull
        private LocalTime endTime;
        @NotNull
        @Min(1)
        private Integer durationMinutes;
        private Boolean active = true;
    }
}
