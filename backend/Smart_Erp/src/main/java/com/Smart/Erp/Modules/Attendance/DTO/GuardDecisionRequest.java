package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardDecisionRequest {
    private String checkInToken;
    private boolean approved;
    private String rejectionReason;
    private String deviceDetails;
}
