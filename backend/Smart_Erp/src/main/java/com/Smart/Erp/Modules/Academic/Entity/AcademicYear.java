package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.AcademicYear.AcademicYearResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Subject.Entity.Assignment;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;
import lombok.*;
import org.apache.commons.lang3.builder.ToStringExclude;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Entity
@Table(name = "academic_years")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicYear extends BaseAuditableEntity implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code;

    @Builder.Default
    private ActiveStatus activeStatus = ActiveStatus.DISABLE;

    private LocalDate startDate;

    private LocalDate endDate;

    @Builder.Default
    private Boolean current = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id", nullable = false)
    private University university;

    @ToStringExclude
    @OneToMany(mappedBy = "academicYear")
    @Builder.Default
    private List<Section> sections = new ArrayList<>();

    @ToStringExclude
    @OneToMany(
            mappedBy = "academicYear"
    )
    @Builder.Default
    private List<Assignment> assignments = new ArrayList<>();

    @ToStringExclude
    @OneToMany(
            mappedBy = "academicYear"
    )
    @Builder.Default
    private List<FeeStructure> feeStructures = new ArrayList<>();

    public String getStudentPostfix(){
        long studentCount = sections.stream()
                .mapToLong(section -> section.getStudentEnrollments().size())
                .sum();

        String codePrefix = this.code;

        return codePrefix.replace(university.getCode(), "") + "-" + String.format("%06d", studentCount + 1);
    }

    @Override
    public void setCodeWithPrefix(String code) {
        this.code = code +  university.getCode();
    }

    public AcademicYearResponse mapToResponse(List<PermissionAction> permissionActions) {

        return AcademicYearResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .startDate(this.getStartDate())
                .endDate(this.getEndDate())
                .current(this.getCurrent())
                .activeStatus(this.getActiveStatus())
                .university(university.toCommonDTO())
                .permissionActions(permissionActions)
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .createdBy(this.getCreatedBy().toCommonDTO())
                .updatedBy(this.getUpdatedBy().toCommonDTO())
                .build();
    }
}