package com.Smart.Erp.Modules.Finance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Finance.Enum.AdjustmentType;
import com.Smart.Erp.Modules.Finance.Enum.FeeAccountStatus;
import com.Smart.Erp.Modules.Finance.Enum.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "student_fee_accounts",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_student_enrollment_fee_structure",
                        columnNames = {"student_enrollment_id", "fee_structure_id"}
                )
        },
        indexes = {
                @Index(name = "idx_fee_account_student", columnList = "student_enrollment_id, status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentFeeAccount extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_enrollment_id", nullable = false, foreignKey = @ForeignKey(name = "fk_fee_acc_enrollment"))
    @ToString.Exclude
    private StudentEnrollment studentEnrollment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fee_structure_id", nullable = false, foreignKey = @ForeignKey(name = "fk_fee_acc_fee_structure"))
    @ToString.Exclude
    private FeeStructure feeStructure;

    // Snapshot of base fee at generation time
    @Column(name = "base_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal baseAmount;

    // Total calculated deduction from applied scholarships
    @Column(name = "scholarship_amount", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal scholarshipAmount = BigDecimal.ZERO;

    // Sum of all student-specific fines and penalties
    @Column(name = "fine_amount", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal fineAmount = BigDecimal.ZERO;

    // Total net payable: (baseAmount + fineAmount - scholarshipAmount - waiverAmount)
    @Column(name = "net_payable_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal netPayableAmount;

    // Total amount collected so far
    @Column(name = "paid_amount", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    // Remaining dues
    @Column(name = "due_balance", precision = 12, scale = 2, nullable = false)
    private BigDecimal dueBalance;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private FeeAccountStatus status = FeeAccountStatus.PENDING;

    // Student-specific adjustments (fines, fee waivers, penalties)
    @OneToMany(
            mappedBy = "feeAccount",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @BatchSize(size = 25)
    @Builder.Default
    private List<StudentFeeAdjustment> adjustments = new ArrayList<>();

    // Payment transactions history
    @OneToMany(
            mappedBy = "feeAccount",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @BatchSize(size = 25)
    @Builder.Default
    private List<FeePayment> payments = new ArrayList<>();

    // Sync helper methods
    public void addAdjustment(StudentFeeAdjustment adjustment) {
        adjustments.add(adjustment);
        adjustment.setFeeAccount(this);
        recalculateTotals();
    }

    public void addPayment(FeePayment payment) {
        payments.add(payment);
        payment.setFeeAccount(this);
        recalculateTotals();
    }

    /**
     * Business calculation for auto-balancing ledger
     */
    public void recalculateTotals() {
        this.fineAmount = adjustments.stream()
                .filter(a -> a.getType() == AdjustmentType.FINE || a.getType() == AdjustmentType.PENALTY)
                .map(StudentFeeAdjustment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal waivers = adjustments.stream()
                .filter(a -> a.getType() == AdjustmentType.WAIVER || a.getType() == AdjustmentType.DISCOUNT)
                .map(StudentFeeAdjustment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.netPayableAmount = this.baseAmount
                .add(this.fineAmount)
                .subtract(this.scholarshipAmount)
                .subtract(waivers)
                .max(BigDecimal.ZERO);

        this.paidAmount = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .map(FeePayment::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.dueBalance = this.netPayableAmount.subtract(this.paidAmount);

        if (this.dueBalance.compareTo(BigDecimal.ZERO) <= 0) {
            this.status = FeeAccountStatus.PAID;
            this.dueBalance = BigDecimal.ZERO;
        } else if (this.paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            this.status = FeeAccountStatus.PARTIALLY_PAID;
        } else {
            this.status = FeeAccountStatus.PENDING;
        }
    }
}