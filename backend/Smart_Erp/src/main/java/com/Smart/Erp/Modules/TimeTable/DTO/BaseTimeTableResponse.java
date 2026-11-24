package com.Smart.Erp.Modules.TimeTable.DTO;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.TimeTable.Enum.BasePeriodType;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalTime;
import java.util.List;

@SuperBuilder
@Getter
public class BaseTimeTableResponse extends BaseDTO {
    private Long id;
    private String name;
    private String description;
    private LocalTime dayStartTime;
    private LocalTime dayEndTime;
    private LocalTime assemblyStartTime;
    private LocalTime assemblyEndTime;
    private Integer periodsPerDay;
    private Integer defaultPeriodDurationMinutes;
    private Integer defaultBreakDurationMinutes;
    private Boolean active;
    private List<PeriodResponse> periods;
    private CommonDTO school;
    private CommonDTO university;
    private List<PermissionAction> permissionActions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeriodResponse {
        private Long id;
        private Integer sequenceNumber;
        private Integer periodNumber;
        private Integer durationMinutes;
        private BasePeriodType periodType;
        private String label;
        private LocalTime startTime;
        private LocalTime endTime;
        private Boolean active;
    }
}