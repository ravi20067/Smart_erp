package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableEntryType;
import com.Smart.Erp.Modules.TimeTable.Enum.WeekDay;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(
        name = "section_timetable_entries",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_version_weekday_period",
                        columnNames = {
                                "timetable_version_id",
                                "day_of_week",
                                "base_period_id"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_timetable_entry_version_day",
                        columnList = "timetable_version_id,day_of_week"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SectionTimetableEntry extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "timetable_version_id", nullable = false)
    private SectionTimetableVersion timetableVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 15)
    private WeekDay dayOfWeek;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "base_period_id", nullable = false)
    private BaseTimeTablePeriod basePeriod;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_enrollment_id", nullable = false)
    private TeacherEnrollment teacherEnrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 20)
    @Builder.Default
    private TimetableEntryType entryType =
            TimetableEntryType.THEORY;

    @Column(length = 500)
    private String remarks;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}