package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.AcademicYear;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.TimeTable.Enum.CalendarStatus;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "section_academic_calendars",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_calendar_section_year",
                        columnNames = {
                                "section_id",
                                "academic_year_id"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_calendar_section_dates",
                        columnList = "section_id,start_date,end_date"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SectionAcademicCalendar extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CalendarStatus status = CalendarStatus.DRAFT;

    // Default operating hours for normal days

    @Column(name = "default_opening_time")
    private LocalTime defaultOpeningTime;

    @Column(name = "default_closing_time")
    private LocalTime defaultClosingTime;

    @OneToMany(
            mappedBy = "calendar",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("calendarDate ASC")
    @Builder.Default
    private List<SectionCalendarDay> days =
            new ArrayList<>();

    public void addDay(SectionCalendarDay day) {
        days.add(day);
        day.setCalendar(this);
    }

    public void removeDay(SectionCalendarDay day) {
        days.remove(day);
        day.setCalendar(null);
    }
}