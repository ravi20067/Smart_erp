package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeSubmissionResponse {
    private String verificationSessionId;
    private String action;
    private boolean accepted;
    private double confidence;
    private String nextChallenge;
    private String nextChallengeDescription;
    private int currentChallengeIndex;
    private int totalChallenges;
    private boolean allChallengesPassed;
    private boolean identityMatched;
    private Double identitySimilarity;
    private String status;
    private String message;
}
