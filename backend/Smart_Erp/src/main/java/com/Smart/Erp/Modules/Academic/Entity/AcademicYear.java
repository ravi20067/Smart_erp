package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Entity
@Table(
        name = "academic_years",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "name")
        }
)
@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicYear extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String code;

    private LocalDate startDate;

    private LocalDate endDate;

    private Boolean current = false;

    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id")
    private University university;

    @Builder.Default
    @OneToMany(
            mappedBy = "academicYear",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<School> schools = new ArrayList<>();

    @ToString.Exclude
    @OneToMany(mappedBy = "academicYear")
    @Builder.Default
    private List<StudentEnrollment> studentEnrollments = new ArrayList<>();

    @ToString.Exclude
    @OneToMany(mappedBy = "academicYear")
    @Builder.Default
    private List<TeacherEnrollment> teacherEnrollments = new ArrayList<>();

    public String getStudentPostfix(){
        long studentCount = Optional.ofNullable(this.getStudentEnrollments())
                .map(List::size)
                .orElse(0);

        return String.format("%06d", studentCount + 1);

    }
}
