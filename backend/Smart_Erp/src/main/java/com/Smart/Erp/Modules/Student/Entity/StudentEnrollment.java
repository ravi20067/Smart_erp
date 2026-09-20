package com.Smart.Erp.Modules.Student.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.Entity.*;
import com.Smart.Erp.Modules.Exam.Entity.ExamResult;
import com.Smart.Erp.Modules.Student.DTO.Enrollment.StudentEnrollmentResponse;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.Finance.Entity.Scholarship;
import com.Smart.Erp.Modules.Finance.Entity.StudentFeeAccount;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

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
public class StudentEnrollment extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "roll_number", nullable = false)
    private String rollNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "academic_year_id", nullable = false, foreignKey = @ForeignKey(name = "fk_student_enrollment_academic_year"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private AcademicYear academicYear;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_group_id", nullable = false, foreignKey = @ForeignKey(name = "fk_student_enrollment_section_group"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private SectionGroup sectionGroup;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false, foreignKey = @ForeignKey(name = "fk_student_enrollment_student"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    @ToString.Exclude
    @OneToMany(mappedBy = "studentEnrollment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ExamResult> examResults = new ArrayList<>();

    @ToString.Exclude
    @OneToMany(mappedBy = "studentEnrollment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<StudentFeeAccount> feeAccounts = new ArrayList<>();

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "first_fee_account_id")
    private StudentFeeAccount firstFeeAccount;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "current_fee_account_id")
    private StudentFeeAccount currentFeeAccount;

    public static StudentEnrollment enrollNewStudent(Student student, Set<Scholarship> scholarships, SectionGroup sectionGroup, AcademicYear academicYear, LocalDate dueDate){
        StudentEnrollment studentEnrollment = StudentEnrollment.builder()
                .academicYear(academicYear)
                .sectionGroup(sectionGroup)
                .student(student)
                .build();
        studentEnrollment.addFeeAccount(StudentFeeAccount.initializeFeeAccount(sectionGroup,scholarships,dueDate));
        return studentEnrollment;
    }

    // ==================== Fee Accounts ====================
    public void generateNextFeeAccount(LocalDate dueDate){
        if (this.currentFeeAccount != null){
            this.addFeeAccount(
                    this.currentFeeAccount.generateNextFeeAccount(dueDate)
            );
        }
    }
    private void addFeeAccount(StudentFeeAccount studentFeeAccount){
        if (studentFeeAccount == null){
            return;
        }
        if (feeAccounts.isEmpty()){
            this.firstFeeAccount = studentFeeAccount;
        }

        studentFeeAccount.setStudentEnrollment(this);

        this.feeAccounts.add(studentFeeAccount);
        this.currentFeeAccount = studentFeeAccount;
    }
    // ==================== Exam Results ====================

    public void addExamResult(ExamResult examResult) {
        examResults.add(examResult);
        examResult.setStudentEnrollment(this);
    }

    public void removeExamResult(ExamResult examResult) {
        examResults.remove(examResult);
        examResult.setStudentEnrollment(null);
    }

    public StudentEnrollmentResponse mapToResponse() {
        Specialization specialization = sectionGroup.getSpecialization();
        Course course = specialization.getCourse();
        Department department = course.getDepartment();
        School school = department.getSchool();

        return StudentEnrollmentResponse.builder()
                .id(this.getId())
                .rollNumber(this.getRollNumber())
                .academicYear(this.getAcademicYear().toCommonDTO())
                .school(school.toCommonDTO())
                .department(department.toCommonDTO())
                .course(course.toCommonDTO())
                .sectionGroup(sectionGroup.toCommonDTO())
                .status(this.getStatus())
                .scholarships(
                        this.getCurrentFeeAccount().getScholarships().stream()
                                .map(CommonReference::toCommonDTO)
                                .toList()
                )
                .frequency(
                        this.getCurrentFeeAccount().getFeeStructure().getFrequency()
                )
                .fees(
                        this.getFeeAccounts().stream()
                                .map(
                                        StudentFeeAccount::mapToResponseForStudent
                                )
                                .toList()
                )
                .build();
    }
}