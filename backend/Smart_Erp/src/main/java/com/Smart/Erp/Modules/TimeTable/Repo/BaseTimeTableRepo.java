package com.Smart.Erp.Modules.TimeTable.Repo;
import com.Smart.Erp.Modules.TimeTable.Entity.BaseTimeTable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface BaseTimeTableRepo extends JpaRepository<BaseTimeTable, Long> {
    List<BaseTimeTable> findBySchoolIdOrderByNameAsc(Long schoolId);
    List<BaseTimeTable> findAllByIdInOrderByNameAsc(List<Long> ids);
    boolean existsBySchoolIdAndNameIgnoreCase(Long schoolId, String name);
}
