package com.Smart.Erp.Modules.Attendance.DTO;

import com.Smart.Erp.Modules.Attendance.Enum.CampusCheckDirection;
import com.Smart.Erp.Modules.Attendance.Enum.CampusPersonRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampusHistoryItemDto {
    private Long id;
    private CampusPersonRole personRole;
    private CampusCheckDirection direction;
    private String status;
    private String fullName;
    private String identifier;
    private String departmentOrCourse;
    private String guardName;
    private String rejectionReason;
    private LocalDateTime requestedAt;
    private LocalDateTime actionTime;
    private boolean checkedOut;
    private Long linkedCheckInId;
}
