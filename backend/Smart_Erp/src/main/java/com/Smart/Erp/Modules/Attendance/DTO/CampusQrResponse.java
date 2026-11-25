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
public class CampusQrResponse {
    private String qrToken;
    private String qrData;
    private CampusCheckDirection direction;
    private CampusPersonRole personRole;
    private String displayName;
    private String identifierLabel;
    private String identifierValue;
    private LocalDateTime expiresAt;
    private String currentCampusStatus;
    private Long openCheckInId;
    private LocalDateTime openCheckInTime;
}
