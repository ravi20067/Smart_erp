package com.Smart.Erp.Modules.TimeTable.Repo;

import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.TimeTable.Entity.SectionTimetableEntry;
import com.Smart.Erp.Modules.TimeTable.Enum.TimetableVersionStatus;
import com.Smart.Erp.Modules.TimeTable.Enum.WeekDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SectionTimetableEntryRepo extends JpaRepository<SectionTimetableEntry, Long> {
    List<SectionTimetableEntry> findByTimetableVersionIdAndDayOfWeekAndActiveTrueOrderByBasePeriod_SequenceNumber(Long id, WeekDay weekDay);

    List<SectionTimetableEntry> findByTimetableVersionId(Long timetableVersionId);

    @Query("SELECT COUNT(e) > 0 FROM SectionTimetableEntry e " +
           "WHERE e.teacherEnrollment.teacher = :teacher " +
           "AND e.dayOfWeek = :dayOfWeek " +
           "AND e.basePeriod.id = :basePeriodId " +
           "AND e.active = true " +
           "AND e.timetableVersion.status = :status")
    boolean existsByTeacherAndDayAndPeriodAndStatus(
            @Param("teacher") Teacher teacher,
            @Param("dayOfWeek") WeekDay dayOfWeek,
            @Param("basePeriodId") Long basePeriodId,
            @Param("status") TimetableVersionStatus status
    );

    @Query("SELECT COUNT(e) > 0 FROM SectionTimetableEntry e " +
           "WHERE e.room.id = :roomId " +
           "AND e.dayOfWeek = :dayOfWeek " +
           "AND e.basePeriod.id = :basePeriodId " +
           "AND e.active = true " +
           "AND e.timetableVersion.status = :status")
    boolean existsByRoomAndDayAndPeriodAndStatus(
            @Param("roomId") Long roomId,
            @Param("dayOfWeek") WeekDay dayOfWeek,
            @Param("basePeriodId") Long basePeriodId,
            @Param("status") TimetableVersionStatus status
    );
}
