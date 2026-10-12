package com.Smart.Erp.Modules.User.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.University;

import com.Smart.Erp.Modules.User.DTO.Role.RoleRequest;
import com.Smart.Erp.Modules.User.DTO.Role.RoleResponse;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
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
    // ACTIVE
    // =========================
    @Column(nullable = false)
    private Boolean active = true;

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

    /**
     * Maps the Role entity to a RoleResponse DTO.
     *
     * @param permissions The list of permissions associated with the role.
     * @return A RoleResponse DTO representing the role.
     */
    public RoleResponse mapToResponse(List<PermissionAction> permissions) {
        return RoleResponse.builder()
                .id(this.id)
                .name(this.name)
                .description(this.description)
                .userRole(this.userRole)
                .active(this.active)
                .userCount(this.users.size())
                .university(this.university.toCommonDTO())
                .permissions(permissions)
                .build();
    }
}