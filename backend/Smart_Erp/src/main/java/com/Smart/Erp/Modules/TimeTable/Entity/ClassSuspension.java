package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "class_suspensions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClassSuspension extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timetable_entry_id")
    private TimetableEntry timetableEntry;

    @Column(name = "suspension_date", nullable = false)
    private LocalDate suspensionDate;

    @Column(name = "reason", nullable = false, length = 255)
    private String reason;

    @Column(name = "suspended_by", length = 100)
    private String suspendedBy;
}

