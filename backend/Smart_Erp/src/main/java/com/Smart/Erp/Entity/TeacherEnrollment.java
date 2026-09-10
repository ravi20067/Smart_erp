package com.Smart.Erp.Entity;

import com.Smart.Erp.Enum.EnrollmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@Entity
@Table(
        name = "teacher_enrollment",
        indexes = {
                @Index(name = "idx_teacher_enrollment_teacher", columnList = "teacher_id"),
                @Index(name = "idx_teacher_enrollment_academic_year", columnList = "academic_year_id")
        }
)
@AllArgsConstructor
@NoArgsConstructor
public class TeacherEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Teacher associated with this enrollment.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "teacher_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_teacher_enrollment_teacher")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Teacher teacher;

    /**
     * Academic year for this enrollment.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "academic_year_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_teacher_enrollment_academic_year")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private AcademicYear academicYear;

    /**
     * Enrollment lifecycle.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    /**
     * Subjects assigned to this teacher enrollment.
     */
    @Builder.Default
    @ManyToMany(mappedBy = "subjectTeachers")
    @ToString.Exclude
    private Set<Subject> subjects = new HashSet<>();
}