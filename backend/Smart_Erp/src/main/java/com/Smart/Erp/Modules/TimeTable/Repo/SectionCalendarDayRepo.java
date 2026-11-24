package com.Smart.Erp.Modules.TimeTable.Repo;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionCalendarDay;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
public interface SectionCalendarDayRepo extends JpaRepository<SectionCalendarDay, Long> {
    Optional<SectionCalendarDay> findByCalendarIdAndCalendarDate(Long calendarId, LocalDate date);
    List<SectionCalendarDay> findByCalendarIdAndCalendarDateBetweenOrderByCalendarDate(Long calendarId, LocalDate from, LocalDate to);
}
