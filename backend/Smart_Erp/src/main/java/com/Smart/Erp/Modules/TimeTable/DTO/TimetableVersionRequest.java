package com.Smart.Erp.Modules.TimeTable.DTO;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableEntryType;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableScope;
import com.Smart.Erp.Modules.TimeTable.Enum.WeekDay;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class TimetableVersionRequest {
    @NotNull
    private TimetableScope scope;
    // SECTION scope: sectionId required, sectionGroupId null.
    // SECTION_GROUP scope: sectionGroupId required, sectionId null.
    private Long sectionId;
    private Long sectionGroupId;
    @NotNull
    private Long baseTimeTableId;
    @NotBlank
    private String name;
    private String description;
    @NotNull
    private LocalDate effectiveFrom;
    private LocalDate effectiveUntil;
    @Valid
    private List<EntryRequest> entries;

    @Data
    public static class EntryRequest {
        @NotNull
        private WeekDay dayOfWeek;
        @NotNull
        private Long basePeriodId;
        @NotNull
        private Long subjectId;
        @NotNull
        private Long teacherEnrollmentId;
        private Long roomId;
        @NotNull
        private TimetableEntryType entryType;
        private String remarks;
    }
}
