package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Academic.Entity.Section;
import com.Smart.Erp.Modules.Academic.Entity.SectionGroup;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableScope;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableVersionStatus;
import com.Smart.Erp.Modules.User.Entity.User;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "section_timetable_versions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_timetable_scope_version",
                        columnNames = {
                                "section_id",
                                "section_group_id",
                                "version_number"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_timetable_version_section_effective",
                        columnList = "section_id,effective_from,effective_until"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SectionTimetableVersion extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Always reference the parent section

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    // Always populated for both SECTION and SECTION_GROUP scope.
    // For SECTION_GROUP scope, this is the owning section of the group.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_group_id")
    private SectionGroup sectionGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TimetableScope scope;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "base_timetable_id", nullable = false)
    private BaseTimeTable baseTimeTable;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TimetableVersionStatus status =
            TimetableVersionStatus.DRAFT;

    // Future activation supported

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_until")
    private LocalDate effectiveUntil;

    @Column(name = "published_at")
    private Instant publishedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "published_by_user_id")
    private User publishedBy;

    @OneToMany(
            mappedBy = "timetableVersion",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private List<SectionTimetableEntry> entries =
            new ArrayList<>();

    public void addEntry(SectionTimetableEntry entry) {
        entries.add(entry);
        entry.setTimetableVersion(this);
    }

    public void removeEntry(SectionTimetableEntry entry) {
        entries.remove(entry);
        entry.setTimetableVersion(null);
    }

    @PrePersist
    @PreUpdate
    private void validateScope() {

        if (scope == null) {
            throw new IllegalStateException("Timetable scope is required.");
        }

        if (section == null) {
            throw new IllegalStateException("Every timetable version must reference its owning section.");
        }

        if (scope == TimetableScope.SECTION
                && sectionGroup != null) {
            throw new IllegalStateException(
                    "SECTION timetable cannot have a SectionGroup"
            );
        }

        if (scope == TimetableScope.SECTION_GROUP) {

            if (sectionGroup == null) {
                throw new IllegalStateException(
                        "SECTION_GROUP requires a SectionGroup"
                );
            }

            if (sectionGroup.getSection() == null
                    || !sectionGroup.getSection().getId().equals(section.getId())) {
                throw new IllegalStateException(
                        "SectionGroup does not belong to this section"
                );
            }
        }

        if (effectiveUntil != null
                && effectiveUntil.isBefore(effectiveFrom)) {
            throw new IllegalStateException(
                    "Effective end date cannot be before start date"
            );
        }
    }
}