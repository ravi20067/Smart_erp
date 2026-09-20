package com.Smart.Erp.Modules.Academic.Entity;


import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.Courses.CourseResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
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
    @JoinColumn(name = "department_id")
    private Department department;

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

    // Assignment only
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_coordinator_id")
    private Teacher programCoordinator;

    @OneToMany(
            mappedBy = "course",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Specialization> specializations = new ArrayList<>();

    public String getPrefix(){
        return this.getDepartment().getPrefix();
    }

    public CourseResponse mapToResponse() {
        School school = department.getSchool();
        AcademicYear academicYear = school.getAcademicYear();

        return CourseResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .activeStatus(this.getActiveStatus())
                .programCoordinator(this.getProgramCoordinator().toCommonDTO())
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
                .academicYear(academicYear.toCommonDTO())
                .school(school.toCommonDTO())
                .department(department.toCommonDTO())
                .NewEnrollmentAllowed(this.getNewEnrollmentAllowed())
                .build();
    }
}
