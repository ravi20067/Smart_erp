package com.Smart.Erp.Modules.Attendance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "face_verification_attempts",
        indexes = {
                @Index(name = "idx_fva_session", columnList = "verification_session_id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceVerificationAttempt extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "verification_session_id", nullable = false)
    private FaceVerificationSession verificationSession;

    @Column(name = "challenge_action", nullable = false, length = 64)
    private String challengeAction;

    @Column(name = "accepted", nullable = false)
    private boolean accepted;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "observations_json", columnDefinition = "TEXT")
    private String observationsJson;

    @Column(name = "attempt_number", nullable = false)
    private int attemptNumber;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
}
