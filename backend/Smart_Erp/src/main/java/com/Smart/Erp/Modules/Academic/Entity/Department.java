package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.Department.DepartmentResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
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

    private String code;

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
    private List<Course> courses = new ArrayList<>();

    // Assignment only
    @ManyToOne
    @JoinColumn(name = "hod_id")
    private Teacher departmentHead;

    public String getPrefix(){
        return this.school.getPrefix();
    }

    public DepartmentResponse mapToResponse() {
        AcademicYear academicYear = school.getAcademicYear();
        return DepartmentResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .activeStatus(this.getActiveStatus())
                .hod(this.getDepartmentHead().toCommonDTO())
                .courses(this.getCourses().stream()
                        .map(CommonReference::toCommonDTO)
                        .toList()
                )
                .school(school.toCommonDTO())
                .academicYear(academicYear.toCommonDTO())
                .build();
    }
}
