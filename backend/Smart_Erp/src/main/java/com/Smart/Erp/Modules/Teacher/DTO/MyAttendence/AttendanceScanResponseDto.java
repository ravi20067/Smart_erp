package com.Smart.Erp.Modules.Teacher.DTO.MyAttendence;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceScanResponseDto {

    private String type;

    private String message;

    private String teacherName;

    private String employeeId;

    private String department;

    private String attendanceTime;

    private String deviceName;


}