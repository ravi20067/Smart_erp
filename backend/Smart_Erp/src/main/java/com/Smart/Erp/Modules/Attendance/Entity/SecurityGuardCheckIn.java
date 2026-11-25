package com.Smart.Erp.Modules.Attendance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Attendance.Enum.GuardCheckInState;
import com.Smart.Erp.Modules.SecurityGuard.Entity.SecurityGuard;
import com.Smart.Erp.Modules.Student.Entity.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "security_guard_check_ins",
        indexes = {
                @Index(name = "idx_sgc_token", columnList = "check_in_token"),
                @Index(name = "idx_sgc_session", columnList = "attendance_session_id"),
                @Index(name = "idx_sgc_student", columnList = "student_id"),
                @Index(name = "idx_sgc_guard", columnList = "guard_id"),
                @Index(name = "idx_sgc_status", columnList = "status")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityGuardCheckIn extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "check_in_token", nullable = false, unique = true, length = 64)
    private String checkInToken;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attendance_session_id", nullable = false)
    private AttendanceSession attendanceSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guard_id")
    private SecurityGuard guard;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private GuardCheckInState status = GuardCheckInState.PENDING;

    @Column(name = "rejection_reason", length = 512)
    private String rejectionReason;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "action_time")
    private LocalDateTime actionTime;

    @Column(name = "client_device_details", length = 256)
    private String clientDeviceDetails;
}
