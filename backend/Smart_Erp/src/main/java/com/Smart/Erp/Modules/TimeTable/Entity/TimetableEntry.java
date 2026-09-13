package com.Smart.Erp.Modules.TimeTable.Entity;


import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import jakarta.persistence.*;
import lombok.*;
import java.time.DayOfWeek;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "timetable_entries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TimetableEntry extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "timetable_id", nullable = false)
    private Timetable timetable;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 15)
    private DayOfWeek dayOfWeek;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "time_slot_id", nullable = false)
    private TimeSlot timeSlot;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_enrollment_id", nullable = false)
    private TeacherEnrollment teacherEnrollment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "timetable_entry_section_groups",
            joinColumns = @JoinColumn(name = "timetable_entry_id"),
            inverseJoinColumns = @JoinColumn(name = "section_group_id")
    )
    @Builder.Default
    private Set<SectionGroup> sectionGroups = new HashSet<>();

    @Column(name = "consecutive_periods", nullable = false)
    private Integer consecutivePeriods = 1;

    @Column(name = "is_fixed", nullable = false)
    private Boolean isFixed = false;
}


