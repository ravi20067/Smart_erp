package com.Smart.Erp.Modules.User.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.User.Enum.PermissionGrantStatus;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_permission_grants",
        indexes = {
                @Index(
                        name = "idx_upg_user_permission",
                        columnList = "user_id, permission_id"
                ),
                @Index(
                        name = "idx_upg_validity",
                        columnList = "valid_from, valid_until"
                )
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissionGrant extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // =========================
    // USER RECEIVING PERMISSION
    // =========================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    @ToString.Exclude
    private User user;


    // =========================
    // PERMISSION
    // =========================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "permission_id",
            nullable = false
    )
    @ToString.Exclude
    private Permission permission;


    // =========================
    // VALIDITY
    // =========================

    @Column(
            name = "valid_from",
            nullable = false
    )
    private LocalDateTime validFrom;


    @Column(
            name = "valid_until",
            nullable = false
    )
    private LocalDateTime validUntil;


    // =========================
    // APPROVAL
    // =========================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "granted_by",
            nullable = false
    )
    @ToString.Exclude
    private User grantedBy;


    // =========================
    // STATUS
    // =========================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PermissionGrantStatus status;


    // =========================
    // REASON
    // =========================

    @Column(length = 1000)
    private String reason;
    // =========================
    // HELPER
    // =========================
    public boolean isCurrentlyActive(
            LocalDateTime now
    ) {
        return status == PermissionGrantStatus.APPROVED
                && !now.isBefore(validFrom)
                && !now.isAfter(validUntil);
    }
}
