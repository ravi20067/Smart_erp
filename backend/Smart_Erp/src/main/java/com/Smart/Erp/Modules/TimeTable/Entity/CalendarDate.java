package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import jakarta.persistence.*;import lombok.*;import java.time.DayOfWeek;
import java.time.LocalDate;

@Entity
@Table(name = "calendar_dates", uniqueConstraints = {@UniqueConstraint(columnNames = {"academic_calendar_id", "date"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarDate extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "academic_calendar_id", nullable = false)
    private AcademicCalendar academicCalendar;
    @Column(name = "date", nullable = false)
    private LocalDate date;
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 15)
    private DayOfWeek dayOfWeek;
    @Enumerated(EnumType.STRING)
    @Column(name = "date_type", nullable = false, length = 30)
    private DateType dateType;
    @Column(name = "title", length = 100)
    private String title;
    @Column(name = "is_class_suspended", nullable = false)
    private Boolean isClassSuspended = false;

    public enum DateType {ACADEMIC_DAY,HOLIDAY,EXAM_DAY,INSTITUTIONAL_EVENT}
}
