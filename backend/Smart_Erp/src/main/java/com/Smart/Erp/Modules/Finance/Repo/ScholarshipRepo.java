package com.Smart.Erp.Modules.Finance.Repo;

import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.Finance.Entity.Scholarship;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface ScholarshipRepo extends JpaRepository<Scholarship,Long> {
    Set<Scholarship> findByIdIn(Set<Long> ids);
    Set<Scholarship> findByIdInAndUniversity(
            Collection<Long> ids,
            University university
    );
}
