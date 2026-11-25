package com.Smart.Erp.Modules.Attendance.DTO;

import com.Smart.Erp.Modules.Attendance.Enum.AttendanceEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSocketMessage {
    private AttendanceEventType eventType;
    private String sessionUuid;
    private Long studentId;
    private String studentName;
    private String rollNumber;
    private String status;
    private LocalDateTime timestamp;
    private String message;
}
