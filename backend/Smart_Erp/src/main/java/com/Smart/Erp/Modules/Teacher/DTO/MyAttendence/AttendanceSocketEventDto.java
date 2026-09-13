package com.Smart.Erp.Modules.Teacher.DTO.MyAttendence;

import com.Smart.Erp.Modules.Teacher.Enum.AttendanceStatusType;
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
public class AttendanceSocketEventDto {

    /**
     * WAITING
     * SCANNED
     * SUCCESS
     * FAILED
     * EXPIRED
     */
    private AttendanceStatusType status;

    /**
     * Message
     */
    private String message;

    /**
     * Today's Attendance Card
     */
    private TodayAttendanceDto todayAttendance;

    /**
     * Timeline
     */
    private List<ActivityItemDto> recentActivity;

    private LocalDateTime eventTime;

}