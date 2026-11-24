
package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionGroupResponse;
import com.Smart.Erp.Modules.Student.DTO.SectionGroupFilter;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.TimeTable.Entity.DailyTimetableOverride;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableVersion;
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
public class SectionGroup extends BaseAuditableEntity
        implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Transient
    private String code;


    // =====================================================
    // SECTION RELATIONSHIP
    // =====================================================

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private Section section;


    // Specialization
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specialization_id")
    private Specialization specialization;


    // Student Enrollments
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "sectionGroup")
    @Builder.Default
    private List<StudentEnrollment> studentEnrollments =
            new ArrayList<>();


    // =====================================================
    // TIMETABLE RELATIONSHIPS
    // =====================================================

    // Timetable versions specifically assigned to this group
    @OneToMany(mappedBy = "sectionGroup")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<SectionTimetableVersion> timetableVersions =
            new ArrayList<>();


    // Daily overrides specifically assigned to this group
    @OneToMany(mappedBy = "sectionGroup")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<DailyTimetableOverride> timetableOverrides =
            new ArrayList<>();


    // =====================================================
    // EXISTING METHODS
    // =====================================================

    public void setCodeWithPrefix(String code) {
        this.code = code;
    }

    public String getStudentRollPrefix() {

        Course course = section.getCourse();
        AcademicYear academicYear = section.getAcademicYear();

        Department department = course.getDepartment();
        School school = department.getSchool();
        University university = school.getUniversity();

        return university.getCode()
                + school.getId()
                + department.getId()
                + academicYear.getId()
                + course.getId()
                + section.getId();
    }

    public SectionGroupResponse mapToResponse(SectionGroup this) {

        return SectionGroupResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .specialization(
                        this.getSpecialization() == null
                                ? null
                                : this.getSpecialization().toCommonDTO()
                )
                .studentCount(this.getStudentEnrollments().size())
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .createdBy(
                        this.getCreatedBy() == null
                                ? null
                                : this.getCreatedBy().toCommonDTO()
                )
                .updatedBy(
                        this.getUpdatedBy() == null
                                ? null
                                : this.getUpdatedBy().toCommonDTO()
                )
                .build();
    }

    public SectionGroupFilter toSectionGroupFilter() {

        return SectionGroupFilter.builder()
                .sectionGroup(this.toCommonDTO())
                .specialization(this.getSpecialization().toCommonDTO())
                .courses(this.specialization.getCourse().toCommonDTO())
                .academicYear(this.section.getAcademicYear().toCommonDTO())
                .department(
                        this.specialization.getCourse()
                                .getDepartment().toCommonDTO()
                )
                .school(
                        this.specialization.getCourse()
                                .getDepartment().getSchool().toCommonDTO()
                )
                .university(
                        this.specialization.getCourse()
                                .getDepartment().getSchool()
                                .getUniversity().toCommonDTO()
                )
                .build();
    }

    public University getUniversity() {
        return section.getAcademicYear().getUniversity();
    }
}
