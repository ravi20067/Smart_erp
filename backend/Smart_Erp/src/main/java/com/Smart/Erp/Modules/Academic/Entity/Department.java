package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.Department.DepartmentResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;




@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Department extends BaseAuditableEntity implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String code;

    @Builder.Default
    private ActiveStatus activeStatus = ActiveStatus.DISABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    private School school;

    @Builder.Default
    @OneToMany(
            mappedBy = "department",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<AcademicYear> academicYears = new ArrayList<>();


    public void setCodeWithPrefix(String code){
        this.code = school.getCode() + code;
    }

    public DepartmentResponse mapToResponse(List<PermissionAction> permissionActions) {

        return DepartmentResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .activeStatus(this.getActiveStatus())
                .academicYears(this.academicYears.stream()
                        .map(AcademicYear::toCommonDTO)
                        .toList()
                )
                .school(school.toCommonDTO())
                .university(school.getUniversity().toCommonDTO())
                .permissionActions(permissionActions)
                .build();
    }
}
