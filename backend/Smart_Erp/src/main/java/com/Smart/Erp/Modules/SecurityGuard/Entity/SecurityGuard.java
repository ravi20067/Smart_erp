package com.Smart.Erp.Modules.SecurityGuard.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.SecurityGuard.DTO.SecurityGuardResponse;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(
        name = "security_guards",
        indexes = {
                @Index(name = "idx_security_guard_user", columnList = "user_id"),
                @Index(name = "idx_security_guard_badge", columnList = "badge_number")
        }
)
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityGuard extends BaseAuditableEntity implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "badge_number", unique = true, length = 60)
    private String badgeNumber;

    @Column(name = "assigned_gate", length = 100)
    private String assignedGate;

    @Column(name = "shift", length = 50)
    @Builder.Default
    private String shift = "DAY";

    @Column(name = "emergency_contact", length = 30)
    private String emergencyContact;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true
    )
    private User user;

    @Override
    public String getName() {
        if (this.user != null && this.user.getBasicDetail() != null) {
            String first = this.user.getBasicDetail().getFirstName();
            String last = this.user.getBasicDetail().getLastName();
            return ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
        }
        return "";
    }

    @Override
    public String getCode() {
        if (this.badgeNumber != null && !this.badgeNumber.isBlank()) {
            return this.badgeNumber;
        }
        return this.user != null ? this.user.getUsername() : "";
    }

    @Override
    public void setCodeWithPrefix(String code) {
        this.badgeNumber = code;
    }

    public SecurityGuardResponse mapToResponse(List<PermissionAction> permissionActions) {
        return SecurityGuardResponse.builder()
                .id(this.getId())
                .badgeNumber(this.getBadgeNumber())
                .assignedGate(this.getAssignedGate())
                .shift(this.getShift())
                .emergencyContact(this.getEmergencyContact())
                .joiningDate(this.getJoiningDate())
                .basicDetailRequest(this.getUser() != null && this.getUser().getBasicDetail() != null
                        ? this.getUser().getBasicDetail().mapToResponse()
                        : null)
                .university(this.getUser() != null && this.getUser().getUniversity() != null
                        ? this.getUser().getUniversity().toCommonDTO()
                        : null)
                .permissionActions(permissionActions)
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .createdBy(this.getCreatedBy() != null ? this.getCreatedBy().toCommonDTO() : null)
                .updatedBy(this.getUpdatedBy() != null ? this.getUpdatedBy().toCommonDTO() : null)
                .build();
    }
}
