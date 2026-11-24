package com.Smart.Erp.Modules.TimeTable.DTO;

import com.Smart.Erp.Modules.TimeTable.Enum.OverrideAction;
import com.Smart.Erp.Modules.TimeTable.Enum.OverrideApprovalMode;
import com.Smart.Erp.Modules.TimeTable.Enum.OverrideStatus;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableEntryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverrideResponse {
    private Long id;
    private Long sectionId;
    private Long sectionGroupId;
    private Long originalEntryId;
    private Long approvedByUserId;
    private Long supersedesOverrideId;
    private LocalDate overrideDate;
    private OverrideAction action;
    private OverrideApprovalMode approvalMode;
    private OverrideStatus status;
    private String reason;
    private Integer revisionNumber;
    private Instant approvedAt;
    private DetailResponse detail;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailResponse {
        private Long id;
        private Long basePeriodId;
        private Long subjectId;
        private Long teacherEnrollmentId;
        private Long roomId;
        private TimetableEntryType entryType;
        private String remarks;
    }
}