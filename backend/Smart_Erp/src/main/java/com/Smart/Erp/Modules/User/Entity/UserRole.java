package com.Smart.Erp.Modules.User.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "user_roles",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_user_role",
                        columnNames = {
                                "user_id",
                                "role_id"
                        }
                )
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRole extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // =========================
    // USER
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
    // ASSIGNMENT INFORMATION
    // =========================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    @ToString.Exclude
    private User assignedBy;

    @Column(nullable = false)
    private Boolean active = true;
}
