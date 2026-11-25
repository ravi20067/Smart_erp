package com.Smart.Erp.Modules.TimeTable.DTO;

import com.Smart.Erp.Modules.TimeTable.Enum.TimetableScope;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoGenerateTimetableRequest {

    @NotNull(message = "Section ID is required")
    private Long sectionId;

    private Long sectionGroupId;

    private TimetableScope scope;

    @NotNull(message = "Base timetable template ID is required")
    private Long baseTimeTableId;

    private Long academicYearId;

    private String name;

    private String description;

    @NotNull(message = "Effective from date is required")
    private LocalDate effectiveFrom;

    private LocalDate effectiveUntil;

    private List<Long> preferredRoomIds;

    @Builder.Default
    private boolean publishImmediately = false;
}
