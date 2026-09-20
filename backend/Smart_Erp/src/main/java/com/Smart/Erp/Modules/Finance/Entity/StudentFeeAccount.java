package com.Smart.Erp.Modules.Finance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Finance.DTO.Student.FeeResponse;
import com.Smart.Erp.Modules.Finance.Enum.ScholarshipType;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Finance.Enum.AdjustmentType;
import com.Smart.Erp.Modules.Finance.Enum.FeeAccountStatus;
import com.Smart.Erp.Modules.Finance.Enum.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Entity
@Table(
        name = "student_fee_accounts",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_student_enrollment_fee_structure",
                        columnNames = {"student_enrollment_id", "fee_structure_id", "installment_no"}
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

    // Added field to track the current installment number
    @Column(name = "installment_no", nullable = false)
    @Builder.Default
    private Integer installmentNo = 1;

    // --- LINKED LIST POINTERS FOR CARRY-FORWARD DUES ---

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_account_id", foreignKey = @ForeignKey(name = "fk_fee_acc_previous"))
    @ToString.Exclude
    private StudentFeeAccount previousAccount;

    @OneToOne(mappedBy = "previousAccount", fetch = FetchType.LAZY)
    @ToString.Exclude
    private StudentFeeAccount nextAccount;

    // ---------------------------------------------------

    @Builder.Default
    @Column(name = "base_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal baseAmount = BigDecimal.ZERO;

    @ToString.Exclude
    @ManyToMany
    @JoinTable(
            name = "student_fee_account_scholarship",
            joinColumns = @JoinColumn(name = "student_fee_account_id"),
            inverseJoinColumns = @JoinColumn(name = "scholarship_id")
    )
    @Builder.Default
    private Set<Scholarship> scholarships = new HashSet<>();

    @Column(name = "fine_amount", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal fineAmount = BigDecimal.ZERO;

    @Column(name = "net_payable_amount", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal netPayableAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "due_balance", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal dueBalance = BigDecimal.ZERO;

    @Column(name = "due_date")
    @Builder.Default
    private LocalDate dueDate = LocalDate.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private FeeAccountStatus status = FeeAccountStatus.PENDING;

    @OneToMany(mappedBy = "feeAccount", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 25)
    @Builder.Default
    private List<StudentFeeAdjustment> adjustments = new ArrayList<>();

    @OneToMany(mappedBy = "feeAccount", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 25)
    @Builder.Default
    private List<FeePayment> payments = new ArrayList<>();


    // ==================== Sync Helper Methods ====================

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

    public void linkPreviousAccount(StudentFeeAccount previous) {
        this.previousAccount = previous;
        if (previous != null) {
            previous.setNextAccount(this);
        }
    }

    // ==================== Business Calculations ====================

    public void recalculateTotals() {

        this.baseAmount = (this.feeStructure != null && this.feeStructure.getTotalAmount() != null)
                ? this.feeStructure.getTotalAmount()
                : BigDecimal.ZERO;

        BigDecimal scholarshipAmount =
                this.scholarships.stream()
                        .map(
                                scholarship ->
                                        scholarship.getFinalAmount(feeStructure)
                        )
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

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
                .subtract(scholarshipAmount)
                .subtract(waivers)
                .max(BigDecimal.ZERO);

        this.paidAmount = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .map(FeePayment::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.dueBalance = this.netPayableAmount.subtract(this.paidAmount);

        if (this.dueBalance.compareTo(BigDecimal.ZERO) == 0) {
            this.status = FeeAccountStatus.PAID;
            this.dueBalance = BigDecimal.ZERO;
        } else if (this.paidAmount.compareTo(BigDecimal.ZERO) > 0) {
            this.status = FeeAccountStatus.PARTIALLY_PAID;
        } else if (this.dueBalance.compareTo(BigDecimal.ZERO) < 0) {
            this.status = FeeAccountStatus.OVER_PAID;
        } else {
            this.status = FeeAccountStatus.PENDING;
        }
    }
    public static StudentFeeAccount initializeFeeAccount(SectionGroup sectionGroup, Set<Scholarship> scholarships, LocalDate dueDate) {
        return StudentFeeAccount.builder()
                .feeStructure(sectionGroup.getSpecialization().getFeeStructure())
                .scholarships(scholarships)
                .dueDate(dueDate)
                .build();
    }
    public void adjustFeeStructureChange(FeeStructure feeStructure) {
        this.feeStructure = feeStructure;
        recalculateTotals();
        if (this.nextAccount != null){
            this.nextAccount.adjustFeeStructureChange(feeStructure);
        }
    }

    public StudentFeeAccount generateNextFeeAccount(LocalDate dueDate) {
        Set<Scholarship> scholarshipSet =
                this.getScholarships().stream()
                        .filter(
                                scholarship ->
                                        !scholarship.getScholarshipType().equals(ScholarshipType.ONE_TIME)
                        )
                        .collect(Collectors.toSet());

        StudentFeeAccount studentFeeAccount =
                StudentFeeAccount.builder()
                        .feeStructure(this.feeStructure)
                        .scholarships(scholarshipSet)
                        .dueDate(dueDate)
                        .build();

        studentFeeAccount.linkPreviousAccount(this);
        studentFeeAccount.recalculateTotals();
        return studentFeeAccount;
    }

    public FeeResponse mapToResponseForStudent(){
        return FeeResponse.builder()
                .id(this.getId())
                .netPayableAmount(this.getNetPayableAmount())
                .dueDate(this.getDueDate())
                .build();
    }
}