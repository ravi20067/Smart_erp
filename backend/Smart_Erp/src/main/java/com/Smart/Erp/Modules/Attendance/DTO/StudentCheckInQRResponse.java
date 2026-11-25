package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentCheckInQRResponse {
    private String checkInToken;
    private String sessionUuid;
    private Long studentId;
    private String studentName;
    private String rollNumber;
    private String courseName;
    private String sectionName;
    private LocalDateTime expiresAt;
    private String qrData;
}
