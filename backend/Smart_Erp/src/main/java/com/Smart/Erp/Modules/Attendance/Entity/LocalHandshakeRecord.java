package com.Smart.Erp.Modules.Attendance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Student.Entity.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "local_handshake_records",
        indexes = {
                @Index(name = "idx_lhr_receipt", columnList = "receipt_id"),
                @Index(name = "idx_lhr_session", columnList = "attendance_session_id"),
                @Index(name = "idx_lhr_student", columnList = "student_id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocalHandshakeRecord extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attendance_session_id", nullable = false)
    private AttendanceSession attendanceSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "receipt_id", nullable = false, unique = true, length = 64)
    private String receiptId;

    @Column(name = "client_ip", nullable = false, length = 64)
    private String clientIp;

    @Column(name = "teacher_server_ip", nullable = false, length = 64)
    private String teacherServerIp;

    @Column(name = "teacher_server_port", nullable = false)
    private int teacherServerPort;

    @Column(name = "nonce", nullable = false, length = 64)
    private String nonce;

    @Column(name = "ticket_id", length = 96)
    private String ticketId;

    @Column(name = "teacher_nonce", length = 128)
    private String teacherNonce;

    @Column(name = "student_nonce", length = 128)
    private String studentNonce;

    @Column(name = "student_ed25519_public_key", length = 256)
    private String studentEd25519PublicKey;

    @Column(name = "student_x25519_public_key", length = 256)
    private String studentX25519PublicKey;

    @Column(name = "teacher_receipt_signature", length = 256)
    private String teacherReceiptSignature;

    @Column(name = "student_proof_signature", length = 256)
    private String studentProofSignature;

    @Column(name = "receipt_hmac", length = 128)
    private String receiptHmac;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "signature", nullable = false, length = 256)
    private String signature;

    @Column(name = "status", nullable = false, length = 32)
    private String status;
}
