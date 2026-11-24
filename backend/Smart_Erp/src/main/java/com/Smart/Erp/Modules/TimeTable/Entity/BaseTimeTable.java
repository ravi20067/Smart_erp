package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.School;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "base_timetables",
        indexes = {
                @Index(name = "idx_base_timetable_school",
                        columnList = "school_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BaseTimeTable extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    // Overall daily operating time

    @Column(name = "day_start_time", nullable = false)
    private LocalTime dayStartTime;

    @Column(name = "day_end_time", nullable = false)
    private LocalTime dayEndTime;

    // Number of actual teaching periods

    @Column(name = "periods_per_day", nullable = false)
    private Integer periodsPerDay;

    @Column(name = "default_period_duration_minutes",
            nullable = false)
    private Integer defaultPeriodDurationMinutes;

    @Column(name = "default_break_duration_minutes")
    private Integer defaultBreakDurationMinutes;

    // Optional assembly

    @Column(name = "assembly_start_time")
    private LocalTime assemblyStartTime;

    @Column(name = "assembly_end_time")
    private LocalTime assemblyEndTime;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean active = true;

    // Period configuration

    @OneToMany(
            mappedBy = "baseTimeTable",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("sequenceNumber ASC")
    @Builder.Default
    private List<BaseTimeTablePeriod> periods =
            new ArrayList<>();

    public void addPeriod(BaseTimeTablePeriod period) {
        periods.add(period);
        period.setBaseTimeTable(this);
    }

    public void removePeriod(BaseTimeTablePeriod period) {
        periods.remove(period);
        period.setBaseTimeTable(null);
    }
}