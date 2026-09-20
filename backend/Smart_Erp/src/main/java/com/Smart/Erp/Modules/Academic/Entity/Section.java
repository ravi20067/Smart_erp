package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.Sections.SectionResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "sections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Section  extends BaseAuditableEntity implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code;

    private Integer capacity;

    private ActiveStatus activeStatus = ActiveStatus.DISABLE;


    @Builder.Default
    @OneToMany(
            mappedBy = "section",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<SectionGroup> sectionGroups = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id")
    private Teacher mentor;

    public String getPrefix(){
        return this.getCourse().getPrefix();
    }

    public int getStudentCount(){
        return this.getSectionGroups().stream()
                .mapToInt(sectionGroups -> sectionGroups.getStudentEnrollments().size())
                .sum();
    }

    public Collection<StudentEnrollment> getStudentEnrollments() {
        return sectionGroups.stream()
                .flatMap(sectionGroup -> sectionGroup.getStudentEnrollments().stream())
                .toList();
    }

    public SectionResponse mapToResponse() {
        return SectionResponse.builder()
                .id(this.getName())
                .code(this.getCode().replace(this.getCourse().getCode(), ""))
                .name(this.getName())
                .capacity(this.getCapacity())
                .activeStatus(this.getActiveStatus())
                .sectionGroup(this.getSectionGroups().stream()
                        .map(SectionGroup::mapToResponse)
                        .toList()
                )
                .mentor(this.getMentor().toCommonDTO())
                .build();
    }
}
