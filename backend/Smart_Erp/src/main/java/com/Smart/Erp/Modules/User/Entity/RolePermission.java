package com.Smart.Erp.Modules.User.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "role_permissions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_role_permission",
                        columnNames = {
                                "role_id",
                                "permission_id"
                        }
                )
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolePermission extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // ROLE
    // =========================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "role_id",
            nullable = false
    )
    @ToString.Exclude
    private Role role;

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
    // ACTIVE
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
    private User assignedBy;

    @Column(nullable = false)
    private Boolean active = true;
}
