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
public class StudentVerificationStartResponse {
    private String verificationSessionId;
    private String sessionUuid;
    private String currentChallenge;
    private String challengeDescription;
    private int challengeIndex;
    private int totalChallenges;
    private LocalDateTime expiresAt;
}
