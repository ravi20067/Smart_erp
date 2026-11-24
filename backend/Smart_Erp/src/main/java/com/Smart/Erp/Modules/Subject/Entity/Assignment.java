package com.Smart.Erp.Modules.Subject.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "assignments",
        indexes = {
                @Index(name = "idx_assignment_academic_year", columnList = "academic_year_id")
        }
)
@Data
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class Assignment extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "academic_year_id", nullable = false, foreignKey = @ForeignKey(name = "fk_assignment_academic_year"))
    @ToString.Exclude
    private AcademicYear academicYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Builder.Default
    @OneToMany(
            mappedBy = "assignment",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Chapter> chapters = new ArrayList<>();

    @OneToOne
    @JoinColumn(name = "question_bank_teacher_id")
    private Teacher questionBankTeacher;
    private LocalDate lastDateQuestionBankSummit;

    // Teacher assigned for study material
    @OneToOne
    @JoinColumn(name = "study_material_teacher_id")
    private Teacher studyMaterialTeacher;
    private LocalDate lastDateStudyMaterialSummit;

}
