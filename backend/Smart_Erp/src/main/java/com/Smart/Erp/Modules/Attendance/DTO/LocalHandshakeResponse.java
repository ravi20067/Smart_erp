package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocalHandshakeResponse {
    private String receiptId;
    private String sessionUuid;
    private boolean verified;
    private String status;
    private String message;
    private String receiptSignature;
    private boolean attendanceMarked;
    private Long attendanceId;
    private String attendanceStatus;
}
