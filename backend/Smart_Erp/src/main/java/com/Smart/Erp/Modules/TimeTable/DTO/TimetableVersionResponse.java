package com.Smart.Erp.Modules.TimeTable.DTO;

import com.Smart.Erp.Modules.TimeTable.Enum.TimetableEntryType;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableScope;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableVersionStatus;
import com.Smart.Erp.Modules.TimeTable.Enum.WeekDay;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimetableVersionResponse {
    private Long id;
    private Long sectionId;
    private Long sectionGroupId;
    private Long baseTimeTableId;
    private TimetableScope scope;
    private Integer versionNumber;
    private String name;
    private String description;
    private TimetableVersionStatus status;
    private LocalDate effectiveFrom;
    private LocalDate effectiveUntil;
    private Instant publishedAt;
    private List<EntryResponse> entries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntryResponse {
        private Long id;
        private Long basePeriodId;
        private Long subjectId;
        private Long teacherEnrollmentId;
        private Long roomId;
        private WeekDay dayOfWeek;
        private TimetableEntryType entryType;
        private String remarks;
        private Boolean active;
    }
}