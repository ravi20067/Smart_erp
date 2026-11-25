package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartAttendanceRequest {
    private Long academicYearId;
    private Long courseId;
    private Long sectionId;
    private Long subjectId;
    private String roomNumber;
    private String localServerIp;
    private Integer localServerPort;
    private String teacherEd25519PublicKey;
    private String teacherX25519PublicKey;
    private String allowedSubnets;
}
