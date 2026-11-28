package com.Smart.Erp.Modules.Attendance.DTO;

import com.Smart.Erp.Modules.Attendance.Enum.CampusPersonRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampusStatusResponse {
    private CampusPersonRole personRole;
    private String campusStatus;
    private boolean hasActiveOpenCheckIn;
    private Long openCheckInId;
    private LocalDateTime openCheckInTime;
    private String fullName;
    private String primaryIdentifier;
    private String departmentOrCourse;
    private String sectionOrDesignation;
    private String academicYearName;
    private List<CampusHistoryItemDto> recentHistory;
}
