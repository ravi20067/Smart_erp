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
public class CampusDecisionResponse {
    private String qrToken;
    private CampusPersonRole personRole;
    private CampusCheckDirection direction;
    private String decision;
    private String fullName;
    private LocalDateTime actionTime;
    private String message;
}
