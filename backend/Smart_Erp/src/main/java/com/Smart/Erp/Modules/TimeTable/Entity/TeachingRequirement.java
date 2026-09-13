package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "teaching_requirements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeachingRequirement extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "teaching_requirement_section_groups",
            joinColumns = @JoinColumn(name = "requirement_id"),
            inverseJoinColumns = @JoinColumn(name = "section_group_id")
    )
    @Builder.Default
    private Set<SectionGroup> sectionGroups = new HashSet<>();

    @Column(name = "required_periods_per_week", nullable = false)
    private Integer requiredPeriodsPerWeek;

    @Column(name = "consecutive_periods_per_meeting", nullable = false)
    private Integer consecutivePeriodsPerMeeting = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "required_room_type", nullable = false, length = 30)
    private Room.RoomType requiredRoomType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_teacher_enrollment_id")
    private TeacherEnrollment preferredTeacher;
}
