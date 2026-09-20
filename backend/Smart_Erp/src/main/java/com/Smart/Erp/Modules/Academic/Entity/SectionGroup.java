package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionGroupResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sectionGroup")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionGroup  extends BaseAuditableEntity implements CommonReference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private ActiveStatus activeStatus = ActiveStatus.DISABLE;
    @Transient
    private String code;
    @ManyToOne
    @JoinColumn(name = "section_id")
    private Section section;
    @ManyToOne
    @JoinColumn(name = "specialization_id")
    private Specialization specialization;
    @ToString.Exclude
    @OneToMany(mappedBy = "sectionGroup")
    @Builder.Default
    private List<StudentEnrollment> studentEnrollments = new ArrayList<>();
    public String getPrefix(){
        return this.getSection().getPrefix() + this.getSpecialization().getCode();
    }

    public String getStudentRollPrefix() {
        Course course = section.getCourse();
        Department department = course.getDepartment();
        School school = department.getSchool();
        AcademicYear academicYear = school.getAcademicYear();

        return academicYear.getCode()
                + school.getId()
                + department.getId()
                + course.getId()
                + section.getId();
    }


    public SectionGroupResponse mapToResponse(SectionGroup this){
        return SectionGroupResponse.builder()
                .id(this.getId())
                .activeStatus(this.getActiveStatus())
                .name(this.getName())
                .code(this.getCode())
                .specialization(this.getSpecialization().toCommonDTO())
                .build();
    }

}
