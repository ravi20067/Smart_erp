package com.Smart.Erp.Modules.TimeTable.Repo;
import com.Smart.Erp.Modules.TimeTable.Entity.DailyTimetableOverride;
import com.Smart.Erp.Modules.TimeTable.Enum.OverrideStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
public interface DailyTimetableOverrideRepo extends JpaRepository<DailyTimetableOverride, Long> {
    List<DailyTimetableOverride> findBySectionIdAndOverrideDateAndStatus(Long sectionId, LocalDate date, OverrideStatus status);
    List<DailyTimetableOverride> findBySectionGroupIdAndOverrideDateAndStatus(Long groupId, LocalDate date, OverrideStatus status);
}
