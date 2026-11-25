package com.Smart.Erp.Modules.Attendance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.User.Entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "attendance_audit_logs",
        indexes = {
                @Index(name = "idx_aal_session", columnList = "attendance_session_id"),
                @Index(name = "idx_aal_student", columnList = "student_id"),
                @Index(name = "idx_aal_user", columnList = "user_id"),
                @Index(name = "idx_aal_time", columnList = "timestamp")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceAuditLog extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_session_id")
    private AttendanceSession attendanceSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User performedBy;

    @Column(name = "role_used", length = 32)
    private String role;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "state_from", length = 64)
    private String stateFrom;

    @Column(name = "state_to", length = 64)
    private String stateTo;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
}
