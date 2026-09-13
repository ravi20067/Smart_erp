package com.Smart.Erp.Modules.Finance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Finance.Enum.AdjustmentType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "student_fee_adjustments",
        indexes = {
                @Index(name = "idx_fee_adjustment_account", columnList = "fee_account_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentFeeAdjustment extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fee_account_id", nullable = false, foreignKey = @ForeignKey(name = "fk_adj_fee_account"))
    @ToString.Exclude
    private StudentFeeAccount feeAccount;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private AdjustmentType type;

    @Column(name = "reason", nullable = false, length = 255)
    private String reason; // e.g., "Damaged Lab Multimeter", "Late Payment Surcharge"

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "authorized_by", length = 100)
    private String authorizedBy; // Staff/Admin who approved fine or waiver
}