package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceStatsResponse {
    private String sessionUuid;
    private long totalEligible;
    private long totalPresent;
    private long totalLate;
    private long totalRejected;
    private List<StudentAttendanceItemDto> students;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAttendanceItemDto {
        private Long studentId;
        private String studentName;
        private String rollNumber;
        private String status;
        private LocalTime checkInTime;
        private Double similarityScore;
        private boolean guardApproved;
        private String guardName;
        private String remarks;
    }
}
