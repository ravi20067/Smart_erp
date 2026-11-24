package com.Smart.Erp.Modules.TimeTable.Repo;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableVersion;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableVersionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
public interface SectionTimetableVersionRepo extends JpaRepository<SectionTimetableVersion, Long> {
    List<SectionTimetableVersion> findBySectionIdOrderByVersionNumberDesc(Long sectionId);
    List<SectionTimetableVersion> findBySectionGroupIdOrderByVersionNumberDesc(Long groupId);
    Optional<SectionTimetableVersion> findFirstBySectionIdAndStatusAndEffectiveFromLessThanEqualAndEffectiveUntilIsNullOrderByEffectiveFromDesc(Long sectionId, TimetableVersionStatus status, LocalDate date);
    List<SectionTimetableVersion> findBySectionIdAndStatusAndEffectiveFromLessThanEqualAndEffectiveUntilGreaterThanEqual(Long sectionId, TimetableVersionStatus status, LocalDate from, LocalDate to);
    List<SectionTimetableVersion> findBySectionGroupIdAndStatusAndEffectiveFromLessThanEqualAndEffectiveUntilGreaterThanEqual(Long groupId, TimetableVersionStatus status, LocalDate from, LocalDate to);
}
