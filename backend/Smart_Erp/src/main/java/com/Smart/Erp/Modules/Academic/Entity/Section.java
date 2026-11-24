
package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.TimeTable.Entity.DailyTimetableOverride;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionAcademicCalendar;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableVersion;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(
        name = "sections",
        indexes = {
                @Index(
                        name = "idx_section_academic_year",
                        columnList = "academic_year_id"
                )
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Section extends BaseAuditableEntity implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code;

    @Builder.Default
    private Integer capacity = 0;

    @Builder.Default
    private ActiveStatus activeStatus = ActiveStatus.DISABLE;

    // Section Groups
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    @OneToMany(
            mappedBy = "section",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<SectionGroup> sectionGroups = new ArrayList<>();

    // Academic Year
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "academic_year_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_section_academic_year")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private AcademicYear academicYear;

    // Course
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @OneToMany(
            mappedBy = "section"
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<SectionAcademicCalendar> academicCalendar =  new ArrayList<>();


    // All timetable versions belonging to this section
    @OneToMany(mappedBy = "section")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<SectionTimetableVersion> timetableVersions =
            new ArrayList<>();


    // All daily timetable overrides belonging to this section
    @OneToMany(mappedBy = "section")
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

    public int getStudentCount() {
        return this.getSectionGroups()
                .stream()
                .mapToInt(group ->
                        group.getStudentEnrollments().size()
                )
                .sum();
    }

    public Collection<StudentEnrollment> getStudentEnrollments() {
        return sectionGroups.stream()
                .flatMap(group ->
                        group.getStudentEnrollments().stream()
                )
                .toList();
    }

    public SectionResponse mapToResponse(
            List<PermissionAction> permissionActions
    ) {

        AcademicYear academicYear = this.getAcademicYear();
        Department department = course.getDepartment();
        School school = department.getSchool();
        University university = school.getUniversity();

        return SectionResponse.builder()
                .id(this.getId())
                .code(this.getCode())
                .name(this.getName())
                .capacity(this.getCapacity())
                .activeStatus(this.getActiveStatus())
                .sectionGroup(
                        this.getSectionGroups()
                                .stream()
                                .map(SectionGroup::mapToResponse)
                                .toList()
                )
                .course(course.toCommonDTO())
                .academicYear(academicYear.toCommonDTO())
                .department(department.toCommonDTO())
                .school(school.toCommonDTO())
                .university(university.toCommonDTO())
                .permissionActions(permissionActions)
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
}
