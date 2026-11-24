package com.Smart.Erp.Modules.TimeTable.Services;

import com.Smart.Erp.Modules.TimeTable.Entity.BaseTimeTable;
import com.Smart.Erp.Modules.TimeTable.Entity.DailyTimetableOverride;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionAcademicCalendar;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionCalendarDay;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableVersion;
import com.Smart.Erp.Modules.TimeTable.Enum.OverrideStatus;
import com.Smart.Erp.Modules.TimeTable.Repo.BaseTimeTableRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.DailyTimetableOverrideRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionAcademicCalendarRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionCalendarDayRepo;
import com.Smart.Erp.Modules.TimeTable.Repo.SectionTimetableVersionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/** Read-only queries used by list/detail endpoints. */
@Service
@RequiredArgsConstructor
public class TimetableQueryService {
    private final BaseTimeTableRepo baseRepo;
    private final SectionAcademicCalendarRepo calendarRepo;
    private final SectionCalendarDayRepo dayRepo;
    private final SectionTimetableVersionRepo versionRepo;
    private final DailyTimetableOverrideRepo overrideRepo;
    public List<BaseTimeTable> baseTemplates(Long schoolId) {
        return baseRepo.findBySchoolIdOrderByNameAsc(schoolId);
    }

    public BaseTimeTable baseTemplate(Long id) {
        return baseRepo.findById(id).orElseThrow();
    }

    public SectionAcademicCalendar calendar(Long id) {
        return calendarRepo.findById(id).orElseThrow();
    }

    public List<SectionCalendarDay> calendarDays(Long calendarId, LocalDate from, LocalDate to) {
        return dayRepo.findByCalendarIdAndCalendarDateBetweenOrderByCalendarDate(calendarId, from, to);
    }

    public List<SectionTimetableVersion> sectionVersions(Long sectionId) {
        return versionRepo.findBySectionIdOrderByVersionNumberDesc(sectionId);
    }

    public List<SectionTimetableVersion> groupVersions(Long groupId) {
        return versionRepo.findBySectionGroupIdOrderByVersionNumberDesc(groupId);
    }

    public List<DailyTimetableOverride> sectionOverrides(Long sectionId, LocalDate date) {
        return overrideRepo.findBySectionIdAndOverrideDateAndStatus(sectionId, date, OverrideStatus.PENDING);
    }
}
