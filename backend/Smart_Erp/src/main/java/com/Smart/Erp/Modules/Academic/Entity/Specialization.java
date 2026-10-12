package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.Specialization.SpecializationResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Specialization  extends BaseAuditableEntity implements CommonReference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code = "";

    private ActiveStatus activeStatus = ActiveStatus.DISABLE;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Builder.Default
    @ToString.Exclude
    @ManyToMany(mappedBy = "specializations")
    private List<Subject> subjects = new ArrayList<>();

    @Builder.Default
    @ToString.Exclude
    @OneToMany(mappedBy = "specialization")
    private List<SectionGroup> sectionGroups = new ArrayList<>();


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "fee_structure_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_specialization_fee_structure")
    )
    private FeeStructure feeStructure;


    public void setCodeWithPrefix(String code){
        this.code = course.getCode()+code;
    }

    public String getPostfix(){

        return this.getCourse().getCode()
                + this.getCode();

    }

    public SpecializationResponse mapToResponse(List<PermissionAction> permissionActions) {

        AcademicYear academicYear = course.getAcademicYear();
        Department department = academicYear.getDepartment();
        School school = department.getSchool();
        University university = school.getUniversity();

        return SpecializationResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .activeStatus(this.getActiveStatus())
                .subjects(this.getSubjects().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .sectionGroups(this.getSectionGroups().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .course(course.toCommonDTO())
                .department(department.toCommonDTO())
                .school(school.toCommonDTO())
                .academicYear(academicYear.toCommonDTO())
                .university(university.toCommonDTO())
                .permissionActions(permissionActions)
                .build();
    }
}
