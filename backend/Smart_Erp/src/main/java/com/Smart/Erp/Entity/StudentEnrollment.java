package com.Smart.Erp.Entity;

import com.Smart.Erp.Enum.EnrollmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
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
public class StudentEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Roll number belongs to an enrollment because
     * it can change from one academic year to another.
     */
    @Column(name = "roll_number", nullable = false)
    private Integer rollNumber;

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
}