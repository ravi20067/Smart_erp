package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardStudentDetailResponse {
    private String checkInToken;
    private Long studentId;
    private String studentName;
    private String rollNumber;
    private String registrationNumber;
    private String courseName;
    private String sectionName;
    private String academicYearName;
    private String photoUrl;
    private boolean hasRegisteredPhoto;
    private String sessionUuid;
    private String subjectName;
    private String teacherName;
    private boolean faceVerificationPassed;
    private Double similarityScore;
    private boolean handshakeVerified;
    private String guardCheckInStatus;
    private boolean alreadyDecided;
}
