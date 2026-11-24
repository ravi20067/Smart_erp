
package com.Smart.Erp.Modules.Finance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.Specialization;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(
        name = "fee_structure_specializations",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_academic_year_specialization",
                        columnNames = {
                                "academic_year_id",
                                "specialization_id"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_fee_specialization_structure",
                        columnList = "fee_structure_id"
                )
        }
)
@Getter
@Setter
@ToString
@NoArgsConstructor
@SuperBuilder
public class FeeStructureSpecialization extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "fee_structure_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_fee_specialization_structure"
            )
    )
    @ToString.Exclude
    private FeeStructure feeStructure;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "specialization_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_fee_specialization_specialization"
            )
    )
    @ToString.Exclude
    private Specialization specialization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "academic_year_id",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "fk_fee_specialization_academic_year"
            )
    )
    @ToString.Exclude
    private AcademicYear academicYear;

    public static FeeStructureSpecialization create(
            FeeStructure feeStructure,
            Specialization specialization
    ) {

        if (feeStructure == null || specialization == null) {
            throw new IllegalArgumentException(
                    "Fee structure and specialization are required"
            );
        }

        if (feeStructure.getAcademicYear() == null) {
            throw new IllegalStateException(
                    "Fee structure must have an academic year"
            );
        }

        return FeeStructureSpecialization.builder()
                .feeStructure(feeStructure)
                .specialization(specialization)
                .academicYear(feeStructure.getAcademicYear())
                .build();
    }
}
