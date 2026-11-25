package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardDecisionResponse {
    private String checkInToken;
    private String studentName;
    private String decision;
    private boolean attendanceMarked;
    private String message;
}
