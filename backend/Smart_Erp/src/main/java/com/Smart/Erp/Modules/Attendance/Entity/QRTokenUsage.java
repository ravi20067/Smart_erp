package com.Smart.Erp.Modules.Attendance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "qr_token_usages",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_token_nonce", columnNames = {"token_nonce"})
        },
        indexes = {
                @Index(name = "idx_qtu_nonce", columnList = "token_nonce"),
                @Index(name = "idx_qtu_session", columnList = "session_id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QRTokenUsage extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_nonce", nullable = false, unique = true, length = 64)
    private String tokenNonce;

    @Column(name = "token_type", nullable = false, length = 32)
    private String tokenType;

    @Column(name = "session_id", length = 64)
    private String sessionId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "used_at", nullable = false)
    private LocalDateTime usedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
