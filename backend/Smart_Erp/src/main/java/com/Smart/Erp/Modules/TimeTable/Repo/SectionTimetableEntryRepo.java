package com.Smart.Erp.Modules.TimeTable.Repo;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableEntry;
import com.Smart.Erp.Modules.TimeTable.Enum.WeekDay;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface SectionTimetableEntryRepo extends JpaRepository<SectionTimetableEntry, Long> {
    List<SectionTimetableEntry> findByTimetableVersionIdAndDayOfWeekAndActiveTrueOrderByBasePeriod_SequenceNumber(Long id, WeekDay weekDay);
}
