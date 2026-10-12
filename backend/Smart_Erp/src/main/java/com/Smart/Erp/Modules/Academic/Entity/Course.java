package com.Smart.Erp.Modules.Academic.Entity;


import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course extends BaseAuditableEntity implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id")
    private AcademicYear academicYear;

    private ActiveStatus activeStatus = ActiveStatus.DISABLE;

    private Boolean NewEnrollmentAllowed = false;
    // Course → Subject
    @Builder.Default
    @OneToMany(
            mappedBy = "course",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Subject> subjects = new ArrayList<>();

    // Course → CourseSection

    @Builder.Default
    @OneToMany(
            mappedBy = "course",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Section> sections = new ArrayList<>();

    @OneToMany(
            mappedBy = "course",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Specialization> specializations = new ArrayList<>();

    public void setCodeWithPrefix(String code){
        this.code = academicYear.getCode()+code;
    }

    public CourseResponse mapToResponse(List<PermissionAction> permissionActions) {
        Department department = this.getAcademicYear().getDepartment();
        School school = department.getSchool();
        University university = school.getUniversity();
        return CourseResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .activeStatus(this.getActiveStatus())
                .specializations(this.getSpecializations().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .sections(this.getSections().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .subjects(this.getSubjects().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .newEnrollmentAllowed(this.getNewEnrollmentAllowed())
                .academicYear(this.getAcademicYear().toCommonDTO())
                .department(department.toCommonDTO())
                .school(school.toCommonDTO())
                .university(university.toCommonDTO())
                .permissionActions(permissionActions)
                .build();
    }
}
