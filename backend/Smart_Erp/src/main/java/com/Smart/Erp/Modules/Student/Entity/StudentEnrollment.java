package com.Smart.Erp.Modules.Student.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Exam.Entity.ExamResult;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Finance.Entity.Scholarship;
import com.Smart.Erp.Modules.Finance.Entity.StudentFeeAccount;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Builder
@Entity
@Table(
        name = "student_enrollment",
        indexes = {
                @Index(name = "idx_student_enrollment_student", columnList = "student_id"),
                @Index(name = "idx_student_enrollment_academic_year", columnList = "academic_year_id"),
                @Index(name = "idx_student_enrollment_section_group", columnList = "section_group_id")
        }
)
@AllArgsConstructor
@NoArgsConstructor
public class StudentEnrollment  extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Roll number belongs to an enrollment because
     * it can change from one academic year to another.
     */
    @Column(name = "roll_number", nullable = false)
    private String rollNumber;

    /**
     * Academic year for this enrollment.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "academic_year_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_student_enrollment_academic_year")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private AcademicYear academicYear;
    /**
     * Section group in which the student is enrolled.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "section_group_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_student_enrollment_section_group")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private SectionGroup sectionGroup;
    /**
     * Student associated with this enrollment.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "student_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_student_enrollment_student")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Student student;

    /**
     * Enrollment lifecycle.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    @ToString.Exclude
    @OneToMany(
            mappedBy = "studentEnrollment",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<ExamResult> examResults = new ArrayList<>();

    @ToString.Exclude
    @ManyToMany
    @JoinTable(
            name = "student_enrollment_scholarship",
            joinColumns = @JoinColumn(name = "student_enrollment_id"),
            inverseJoinColumns = @JoinColumn(name = "scholarship_id")
    )
    @Builder.Default
    private Set<Scholarship> scholarships = new HashSet<>();

    @ToString.Exclude
    @OneToMany(
            mappedBy = "studentEnrollment",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<StudentFeeAccount> feeAccounts = new ArrayList<>();

    // ==================== Exam Results ====================

    public void addExamResult(ExamResult examResult) {
        examResults.add(examResult);
        examResult.setStudentEnrollment(this);
    }

    public void removeExamResult(ExamResult examResult) {
        examResults.remove(examResult);
        examResult.setStudentEnrollment(null);
    }
// ==================== Scholarships ====================

    public void addScholarship(Scholarship scholarship) {
        scholarships.add(scholarship);
    }

    public void removeScholarship(Scholarship scholarship) {
        scholarships.remove(scholarship);
    }


// ==================== Fee Accounts ====================

    public void addFeeAccount(StudentFeeAccount feeAccount) {
        feeAccounts.add(feeAccount);
        feeAccount.setStudentEnrollment(this);
    }

    public void removeFeeAccount(StudentFeeAccount feeAccount) {
        feeAccounts.remove(feeAccount);
        feeAccount.setStudentEnrollment(null);
    }
}