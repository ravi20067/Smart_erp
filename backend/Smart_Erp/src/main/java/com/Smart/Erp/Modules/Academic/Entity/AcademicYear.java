package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.AcademicYear.AcademicYearResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
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
@NoArgsConstructor
@AllArgsConstructor
@Builder // <-- CHANGED from @Builder
public class AcademicYear extends BaseAuditableEntity implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String code;

    @Builder.Default // <-- ADDED: So the Builder respects your default value
    private ActiveStatus activeStatus = ActiveStatus.DISABLE;

    private LocalDate startDate;

    private LocalDate endDate;

    @Builder.Default // <-- ADDED: So the Builder respects your default value
    private Boolean current = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Builder.Default
    @OneToMany(
            mappedBy = "academicYear",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Course> courses = new ArrayList<>();

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

    @Override
    public void setCodeWithPrefix(String code) {
        this.code = code + "-" +  department.getCode();
    }

    public AcademicYearResponse mapToResponse(List<PermissionAction> permissionActions) {
        School school = department.getSchool();
        University university = school.getUniversity();

        return AcademicYearResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .startDate(this.getStartDate())
                .endDate(this.getEndDate())
                .current(this.getCurrent())
                .activeStatus(this.getActiveStatus())
                .courses(
                        this.courses.stream()
                                .map(Course::toCommonDTO)
                                .toList()
                )
                .department(department.toCommonDTO())
                .school(school.toCommonDTO())
                .university(university.toCommonDTO())
                .permissionActions(permissionActions)
                .build();
    }
}