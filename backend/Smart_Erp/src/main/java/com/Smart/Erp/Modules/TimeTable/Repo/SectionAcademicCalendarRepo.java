package com.Smart.Erp.Modules.TimeTable.Repo;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionAcademicCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface SectionAcademicCalendarRepo extends JpaRepository<SectionAcademicCalendar, Long> {
    Optional<SectionAcademicCalendar> findBySectionId(Long sectionId);
}
