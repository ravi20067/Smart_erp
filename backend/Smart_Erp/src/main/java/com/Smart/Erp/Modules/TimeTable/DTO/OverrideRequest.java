package com.Smart.Erp.Modules.TimeTable.DTO;
import com.Smart.Erp.Modules.TimeTable.Enum.OverrideAction;
import com.Smart.Erp.Modules.TimeTable.Enum.OverrideApprovalMode;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableEntryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class OverrideRequest {
    @NotNull
    private Long sectionId;
    private Long sectionGroupId;
    @NotNull
    private LocalDate overrideDate;
    @NotNull
    private OverrideAction action;
    @NotNull
    private OverrideApprovalMode approvalMode = OverrideApprovalMode.REQUIRES_APPROVAL;
    private Long originalEntryId;
    @NotBlank
    private String reason;
    // REPLACE and ADD require detail values. CANCEL does not.
    private Long basePeriodId;
    private Long subjectId;
    private Long teacherEnrollmentId;
    private Long roomId;
    private TimetableEntryType entryType;
    private String remarks;
}
