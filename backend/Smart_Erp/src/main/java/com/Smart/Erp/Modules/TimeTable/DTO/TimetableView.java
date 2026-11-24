package com.Smart.Erp.Modules.TimeTable.DTO;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableEntryType;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Value
@Builder
public class TimetableView {
    LocalDate date;
    boolean open;
    String dayTitle;
    String closureReason;
    Long timetableVersionId;
    Integer versionNumber;
    String versionName;
    List<Slot> slots;
    @Value
    @Builder
    public static class Slot {
        Long entryId;
        Integer sequenceNumber;
        Integer periodNumber;
        String periodLabel;
        LocalTime startTime;
        LocalTime endTime;
        String subject;
        String teacher;
        String room;
        TimetableEntryType entryType;
        String note;
        boolean overridden;
    }
}
