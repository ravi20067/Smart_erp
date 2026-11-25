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
public class CampusGuardScanResponse {
    private String qrToken;
    private CampusPersonRole personRole;
    private CampusCheckDirection direction;
    private String status;
    private boolean alreadyDecided;
    private Long userId;
    private Long studentId;
    private Long teacherId;
    private String fullName;
    private String photoUrl;
    private boolean hasRegisteredPhoto;
    private String enrollmentNumber;
    private String courseName;
    private String sectionName;
    private String academicYearName;
    private String employeeId;
    private String departmentName;
    private String designation;
    private LocalDateTime openCheckInTime;
    private LocalDateTime requestedAt;
    private LocalDateTime expiresAt;
}
