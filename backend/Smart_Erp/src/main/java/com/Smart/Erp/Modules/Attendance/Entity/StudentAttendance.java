package com.Smart.Erp.Modules.Attendance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Attendance.Enum.GuardCheckInState;
import com.Smart.Erp.Modules.Attendance.Enum.HandshakeState;
import com.Smart.Erp.Modules.Attendance.Enum.VerificationState;
import com.Smart.Erp.Modules.SecurityGuard.Entity.SecurityGuard;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Teacher.Enum.AttendanceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(
        name = "student_attendances",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_session_student", columnNames = {"attendance_session_id", "student_id"})
        },
        indexes = {
                @Index(name = "idx_stu_att_session", columnList = "attendance_session_id"),
                @Index(name = "idx_stu_att_student", columnList = "student_id"),
                @Index(name = "idx_stu_att_date", columnList = "attendance_date")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttendance extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attendance_session_id", nullable = false)
    private AttendanceSession attendanceSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "check_in_time", nullable = false)
    private LocalTime checkInTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.PRESENT;

    @Enumerated(EnumType.STRING)
    @Column(name = "face_verification_status", nullable = false, length = 32)
    @Builder.Default
    private VerificationState faceVerificationStatus = VerificationState.PASSED;

    @Column(name = "face_verification_session_id", length = 64)
    private String faceVerificationSessionId;

    @Column(name = "similarity_score")
    private Double similarityScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "handshake_status", nullable = false, length = 32)
    @Builder.Default
    private HandshakeState handshakeStatus = HandshakeState.VERIFIED;

    @Column(name = "handshake_receipt_id", length = 64)
    private String handshakeReceiptId;

    @Enumerated(EnumType.STRING)
    @Column(name = "guard_checkin_status", nullable = false, length = 32)
    @Builder.Default
    private GuardCheckInState guardCheckInStatus = GuardCheckInState.APPROVED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guard_id")
    private SecurityGuard guard;

    @Column(name = "guard_decision_time")
    private LocalDateTime guardDecisionTime;

    @Column(name = "rejection_reason", length = 512)
    private String rejectionReason;

    @Column(name = "client_ip", length = 64)
    private String clientIp;

    @Column(name = "remarks", length = 256)
    private String remarks;
}
