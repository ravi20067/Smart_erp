package com.Smart.Erp.Modules.Finance.Entity;


import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Finance.Enum.FeeCategoryType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "fee_components",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_fee_structure_component",
                        columnNames = {"fee_structure_id", "category_type"}
                )
        },
        indexes = {
                @Index(name = "idx_fee_component_structure", columnList = "fee_structure_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeComponent extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fee_structure_id", nullable = false, foreignKey = @ForeignKey(name = "fk_fee_component_structure"))
    private FeeStructure feeStructure;

    @Enumerated(EnumType.STRING)
    @Column(name = "category_type", nullable = false, length = 40)
    private FeeCategoryType categoryType;

    @Column(name = "component_name", nullable = false, length = 100)
    private String componentName;

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "is_mandatory", nullable = false)
    @Builder.Default
    private Boolean isMandatory = true;

    @Column(name = "is_refundable", nullable = false)
    @Builder.Default
    private Boolean isRefundable = false;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FeeComponent that)) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
