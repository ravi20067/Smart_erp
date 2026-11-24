package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.TimeTable.Enum.CalendarDayType;
import com.Smart.Erp.Modules.TimeTable.Enum.OperatingStatus;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
        name = "section_calendar_days",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_calendar_day_date",
                        columnNames = {
                                "calendar_id",
                                "calendar_date"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_calendar_day_date",
                        columnList = "calendar_date"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SectionCalendarDay extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "calendar_id", nullable = false)
    private SectionAcademicCalendar calendar;

    @Column(name = "calendar_date", nullable = false)
    private LocalDate calendarDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_type", nullable = false, length = 25)
    @Builder.Default
    private CalendarDayType dayType = CalendarDayType.REGULAR;

    @Enumerated(EnumType.STRING)
    @Column(name = "operating_status", nullable = false, length = 15)
    @Builder.Default
    private OperatingStatus operatingStatus = OperatingStatus.OPEN;

    @Column(length = 500)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(length = 500)
    private String holidayReason;

    // Null means use calendar default timings

    @Column(name = "opening_time")
    private LocalTime openingTime;

    @Column(name = "closing_time")
    private LocalTime closingTime;

    // Optional timetable version specifically for this date

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applied_timetable_version_id")
    private SectionTimetableVersion appliedTimetableVersion;

    @Builder.Default
    @Column(name = "is_instruction_day", nullable = false)
    private Boolean instructionDay = true;
}