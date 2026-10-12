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


    public void setCodeWithPrefix(String code){
        this.code = merge(specialization.getCode() , section.getCode()) + code;
    }

    public String getStudentRollPrefix() {
        Course course = section.getCourse();
        AcademicYear academicYear = course.getAcademicYear();
        Department department = academicYear.getDepartment();
        School school = department.getSchool();
        University university = school.getUniversity();

        return university.getCode()
                + school.getId()
                + department.getId()
                + academicYear.getId()
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

    public String merge(String sectionCode, String specializationCode) {
        int i = 0;

        while (i < sectionCode.length()
                && i < specializationCode.length()
                && sectionCode.charAt(i) == specializationCode.charAt(i)) {
            i++;
        }

        return sectionCode + specializationCode.substring(i);
    }

    public static String mergeForCode(String sectionCode, String specializationCode) {
        int i = 0;

        while (i < sectionCode.length()
                && i < specializationCode.length()
                && sectionCode.charAt(i) == specializationCode.charAt(i)) {
            i++;
        }

        return sectionCode + specializationCode.substring(i);
    }
}
