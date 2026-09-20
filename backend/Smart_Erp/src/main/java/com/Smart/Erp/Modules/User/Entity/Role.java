package com.Smart.Erp.Modules.User.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.University;

import com.Smart.Erp.Modules.User.Enum.UserRoles;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "roles",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_role_university_name",
                        columnNames = {
                                "university_id",
                                "name"
                        }
                )
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Role extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // UNIVERSITY
    // =========================
    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "university_id",
            nullable = false
    )
    @ToString.Exclude
    private University university;

    // =========================
    // ROLE INFORMATION
    // =========================
    @Column(
            nullable = false,
            length = 100
    )
    private String name;

    @Column(length = 255)
    private String description;


    @Enumerated(EnumType.STRING)
    private UserRoles userRole;

    // =========================
    // SYSTEM ROLE
    // =========================
    @Column(nullable = false)
    private Boolean systemRole = false;


    // =========================
    // ACTIVE
    // =========================
    @Column(nullable = false)
    private Boolean active = true;

    // =========================
    // USERS
    // =========================
    @OneToMany(
            mappedBy = "role"
    )
    @ToString.Exclude
    @Builder.Default
    private List<UserRole> users = new ArrayList<>();


    // =========================
    // PERMISSIONS
    // =========================
    @OneToMany(
            mappedBy = "role",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @ToString.Exclude
    @Builder.Default
    private List<RolePermission> permissions =
            new ArrayList<>();
}