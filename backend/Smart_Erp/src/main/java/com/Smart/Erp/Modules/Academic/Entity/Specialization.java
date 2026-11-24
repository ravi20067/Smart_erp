
package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.Specialization.SpecializationResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructureSpecialization;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "specialization")
@Getter
@Setter
@ToString
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@NoArgsConstructor
@SuperBuilder
public class Specialization extends BaseAuditableEntity
        implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private String name;

    @Builder.Default
    private String code = "";

    @Builder.Default
    @Enumerated(EnumType.STRING)
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

    // One specialization can have multiple fee structure assignments
    @Builder.Default
    @ToString.Exclude
    @OneToMany(mappedBy = "specialization")
    private List<FeeStructureSpecialization> feeStructureAssignments =
            new ArrayList<>();

    public void setCodeWithPrefix(String code) {
        if (this.course == null) {
            throw new IllegalStateException(
                    "Course must be assigned before generating specialization code"
            );
        }

        this.code = this.course.getCode() + code;
    }

    public String getPostfix() {
        return this.course.getCode() + this.code;
    }

    public SpecializationResponse mapToResponse(
            List<PermissionAction> permissionActions
    ) {

        Department department = course.getDepartment();
        School school = department.getSchool();
        University university = school.getUniversity();

        return SpecializationResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .activeStatus(this.getActiveStatus())
                .subjects(this.getSubjects().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList())
                .sectionGroups(this.getSectionGroups().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList())
                .course(course.toCommonDTO())
                .department(department.toCommonDTO())
                .school(school.toCommonDTO())
                .university(university.toCommonDTO())
                .permissionActions(permissionActions)
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .createdBy(this.getCreatedBy() == null
                        ? null : this.getCreatedBy().toCommonDTO())
                .updatedBy(this.getUpdatedBy() == null
                        ? null : this.getUpdatedBy().toCommonDTO())
                .build();
    }

    public FeeStructure getFeeStructure(AcademicYear academicYear) {
        return this.getFeeStructureAssignments().stream()
                .filter(fsa -> fsa.getAcademicYear().equals(academicYear))
                .map(FeeStructureSpecialization::getFeeStructure)
                .findFirst()
                .orElse(null);
    }
}
