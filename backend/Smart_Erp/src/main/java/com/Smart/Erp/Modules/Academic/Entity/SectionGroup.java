
package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionGroupResponse;
import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
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

    /**
     * Resolves the mapped fee structure for this section group's specialization and academic year.
     */
    public FeeStructure resolveMappedFeeStructure() {
        if (this.specialization == null
                || this.section == null
                || this.section.getAcademicYear() == null) {
            return null;
        }
        return this.specialization.getFeeStructure(this.section.getAcademicYear());
    }

    public SectionGroupResponse mapToResponse(SectionGroup this) {
        FeeStructure mappedFeeStructure = resolveMappedFeeStructure();
        CommonDTO feeStructureDto = mappedFeeStructure == null
                ? null
                : CommonDTO.builder()
                        .id(mappedFeeStructure.getId())
                        .name(mappedFeeStructure.getName())
                        .build();

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
                .feeStructure(feeStructureDto)
                .hasFeeStructure(mappedFeeStructure != null)
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
        FeeStructure mappedFeeStructure = resolveMappedFeeStructure();
        CommonDTO feeStructureDto = mappedFeeStructure == null
                ? null
                : CommonDTO.builder()
                        .id(mappedFeeStructure.getId())
                        .name(mappedFeeStructure.getName())
                        .build();
        Integer capacity = this.section != null ? this.section.getCapacity() : null;
        Integer totalSectionStudents = this.section != null ? this.section.getStudentCount() : 0;
        Integer remainingSeats = capacity != null ? Math.max(capacity - totalSectionStudents, 0) : null;

        Course course = this.specialization != null ? this.specialization.getCourse() : null;
        Department department = course != null ? course.getDepartment() : null;
        School school = department != null ? department.getSchool() : null;
        University university = school != null ? school.getUniversity() : null;

        return SectionGroupFilter.builder()
                .sectionGroup(this.toCommonDTO())
                .section(this.section != null ? this.section.toCommonDTO() : null)
                .specialization(this.specialization != null ? this.specialization.toCommonDTO() : null)
                .courses(course != null ? course.toCommonDTO() : null)
                .academicYear(
                        this.section != null && this.section.getAcademicYear() != null
                                ? this.section.getAcademicYear().toCommonDTO()
                                : null
                )
                .department(department != null ? department.toCommonDTO() : null)
                .school(school != null ? school.toCommonDTO() : null)
                .university(university != null ? university.toCommonDTO() : null)
                .feeStructure(feeStructureDto)
                .capacity(capacity)
                .studentCount(totalSectionStudents)
                .availableSeats(remainingSeats)
                .build();
    }

    public University getUniversity() {
        return section.getAcademicYear().getUniversity();
    }
}
