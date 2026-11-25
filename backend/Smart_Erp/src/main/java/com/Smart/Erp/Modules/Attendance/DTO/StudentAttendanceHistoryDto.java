package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttendanceHistoryDto {
    private Long id;
    private String sessionUuid;
    private LocalDate attendanceDate;
    private LocalTime checkInTime;
    private String courseName;
    private String sectionName;
    private String subjectName;
    private String teacherName;
    private String status;
    private Double similarityScore;
    private String guardApproval;
    private String remarks;
}
