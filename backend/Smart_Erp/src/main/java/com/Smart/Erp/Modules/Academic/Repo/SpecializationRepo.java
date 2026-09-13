package com.Smart.Erp.Modules.Academic.Repo;

import com.Smart.Erp.Modules.Academic.Entity.Specialization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpecializationRepo extends JpaRepository<Specialization,Long> {
    List<Specialization> findByIdIn(List<Long> ids);
}
