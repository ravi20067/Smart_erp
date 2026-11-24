package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.TimeTable.Enum.OverrideAction;
import com.Smart.Erp.Modules.TimeTable.Enum.OverrideApprovalMode;
import com.Smart.Erp.Modules.TimeTable.Enum.OverrideStatus;
import com.Smart.Erp.Modules.User.Entity.User;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "daily_timetable_overrides",
        indexes = {
                @Index(
                        name = "idx_override_section_date",
                        columnList = "section_id,override_date,status"
                ),
                @Index(
                        name = "idx_override_group_date",
                        columnList = "section_group_id,override_date,status"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DailyTimetableOverride extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    // Null for section-wide overrides

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_group_id")
    private SectionGroup sectionGroup;

    @Column(name = "override_date", nullable = false)
    private LocalDate overrideDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private OverrideAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_mode", nullable = false, length = 25)
    @Builder.Default
    private OverrideApprovalMode approvalMode =
            OverrideApprovalMode.REQUIRES_APPROVAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OverrideStatus status = OverrideStatus.PENDING;

    // Required for REPLACE and CANCEL

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_entry_id")
    private SectionTimetableEntry originalEntry;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Column(name = "revision_number", nullable = false)
    @Builder.Default
    private Integer revisionNumber = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_user_id")
    private User approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    // Links a newer revision to its previous revision

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supersedes_override_id")
    private DailyTimetableOverride supersedesOverride;

    @OneToOne(
            mappedBy = "override",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private DailyTimetableOverrideDetail detail;
}