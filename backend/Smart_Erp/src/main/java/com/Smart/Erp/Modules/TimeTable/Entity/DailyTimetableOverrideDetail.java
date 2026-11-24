package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableEntryType;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "daily_timetable_override_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DailyTimetableOverrideDetail
        extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "override_id",
            nullable = false,
            unique = true
    )
    private DailyTimetableOverride override;

    // Can be different from the original period

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base_period_id")
    private BaseTimeTablePeriod basePeriod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_enrollment_id")
    private TeacherEnrollment teacherEnrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", length = 20)
    private TimetableEntryType entryType;

    @Column(length = 500)
    private String remarks;
}