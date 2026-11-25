package com.Smart.Erp.Modules.Attendance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Attendance.Enum.CampusCheckDirection;
import com.Smart.Erp.Modules.Attendance.Enum.CampusPersonRole;
import com.Smart.Erp.Modules.Attendance.Enum.GuardCheckInState;
import com.Smart.Erp.Modules.SecurityGuard.Entity.SecurityGuard;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.User.Entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "campus_check_ins",
        indexes = {
                @Index(name = "idx_campus_ci_token", columnList = "qr_token"),
                @Index(name = "idx_campus_ci_user_dir_status", columnList = "user_id, direction, status, checked_out"),
                @Index(name = "idx_campus_ci_student", columnList = "student_id"),
                @Index(name = "idx_campus_ci_teacher", columnList = "teacher_id"),
                @Index(name = "idx_campus_ci_linked", columnList = "linked_check_in_id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampusCheckInRecord extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "qr_token", nullable = false, unique = true, length = 96)
    private String qrToken;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "person_role", nullable = false, length = 24)
    private CampusPersonRole personRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 24)
    private CampusCheckDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    @Builder.Default
    private GuardCheckInState status = GuardCheckInState.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_check_in_id")
    private CampusCheckInRecord linkedCheckIn;

    @Column(name = "checked_out", nullable = false)
    @Builder.Default
    private Boolean checkedOut = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guard_id")
    private SecurityGuard guard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decision_by_user_id")
    private User decisionByUser;

    @Column(name = "rejection_reason", length = 512)
    private String rejectionReason;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "action_time")
    private LocalDateTime actionTime;

    @Column(name = "device_details", length = 256)
    private String deviceDetails;
}
