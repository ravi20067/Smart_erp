package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.TimeTable.Enum.BasePeriodType;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalTime;

@Entity
@Table(
        name = "base_timetable_periods",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_base_period_sequence",
                        columnNames = {
                                "base_timetable_id",
                                "sequence_number"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_base_period_timetable",
                        columnList = "base_timetable_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BaseTimeTablePeriod extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "base_timetable_id", nullable = false)
    private BaseTimeTable baseTimeTable;

    // Sequence in the daily schedule: 1, 2, 3, 4...

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    // Actual teaching period number.
    // Null for breaks, lunch and assembly.

    @Column(name = "period_number")
    private Integer periodNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "period_type", nullable = false, length = 20)
    @Builder.Default
    private BasePeriodType periodType = BasePeriodType.CLASS;

    @Column(nullable = false, length = 80)
    private String label;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean active = true;
}