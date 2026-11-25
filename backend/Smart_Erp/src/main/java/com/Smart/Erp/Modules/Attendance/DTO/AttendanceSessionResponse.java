package com.Smart.Erp.Modules.Attendance.DTO;

import com.Smart.Erp.Modules.Attendance.Enum.AttendanceSessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSessionResponse {
    private Long id;
    private String sessionUuid;
    private String teacherName;
    private String academicYearName;
    private String courseName;
    private String sectionName;
    private String subjectName;
    private String roomNumber;
    private AttendanceSessionStatus status;
    private String localServerIp;
    private Integer localServerPort;
    private String teacherEd25519PublicKey;
    private String teacherX25519PublicKey;
    private String allowedSubnets;
    private String backendPublicKey;
    private String qrPayload;
    private LocalDateTime startTime;
    private LocalDateTime expiresAt;
    private long totalPresent;
    private long totalEligible;
}
