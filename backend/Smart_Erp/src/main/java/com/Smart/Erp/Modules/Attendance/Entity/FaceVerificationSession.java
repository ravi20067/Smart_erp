package com.Smart.Erp.Modules.Attendance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Attendance.Enum.VerificationState;
import com.Smart.Erp.Modules.Student.Entity.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "face_verification_sessions",
        indexes = {
                @Index(name = "idx_fvs_session_id", columnList = "session_id"),
                @Index(name = "idx_fvs_student", columnList = "student_id"),
                @Index(name = "idx_fvs_status", columnList = "status")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceVerificationSession extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, unique = true, length = 64)
    private String sessionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attendance_session_id", nullable = false)
    private AttendanceSession attendanceSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "challenge_sequence", nullable = false, length = 256)
    private String challengeSequence;

    @Column(name = "current_challenge_index", nullable = false)
    @Builder.Default
    private int currentChallengeIndex = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private VerificationState status = VerificationState.PENDING;

    @Column(name = "total_attempts", nullable = false)
    @Builder.Default
    private int totalAttempts = 0;

    @Column(name = "max_attempts", nullable = false)
    @Builder.Default
    private int maxAttempts = 5;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "face_continuity_score")
    private Double faceContinuityScore;

    @Column(name = "anti_spoof_confidence")
    private Double antiSpoofConfidence;

    @Column(name = "matched_similarity")
    private Double matchedSimilarity;

    @Column(name = "failure_reason", length = 512)
    private String failureReason;

    @Builder.Default
    @OneToMany(mappedBy = "verificationSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FaceVerificationAttempt> attempts = new ArrayList<>();
}
