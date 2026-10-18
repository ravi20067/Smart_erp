package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "sections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Section  extends BaseAuditableEntity implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code;
    @Builder.Default
    private Integer capacity = 0;

    @Builder.Default
    private ActiveStatus activeStatus = ActiveStatus.DISABLE;


    @Builder.Default
    @OneToMany(
            mappedBy = "section",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<SectionGroup> sectionGroups = new ArrayList<>();

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    public void setCodeWithPrefix(String code){
        this.code = course.getCode()+code;
    }

    public int getStudentCount(){
        return this.getSectionGroups().stream()
                .mapToInt(sectionGroups -> sectionGroups.getStudentEnrollments().size())
                .sum();
    }

    public Collection<StudentEnrollment> getStudentEnrollments() {
        return sectionGroups.stream()
                .flatMap(sectionGroup -> sectionGroup.getStudentEnrollments().stream())
                .toList();
    }

    public SectionResponse mapToResponse(List<PermissionAction> permissionActions) {

        AcademicYear academicYear = this.getCourse().getAcademicYear();
        Department department = academicYear.getDepartment();
        School school = department.getSchool();
        University university = school.getUniversity();

        return SectionResponse.builder()
                .id(this.getId())
                .code(this.getCode())
                .name(this.getName())
                .capacity(this.getCapacity())
                .activeStatus(this.getActiveStatus())
                .sectionGroup(this.getSectionGroups().stream()
                        .map(SectionGroup::mapToResponse)
                        .toList()
                )
                .course(course.toCommonDTO())
                .academicYear(academicYear.toCommonDTO())
                .department(department.toCommonDTO())
                .school(school.toCommonDTO())
                .university(university.toCommonDTO())
                .permissionActions(permissionActions)
                .build();
    }
}
