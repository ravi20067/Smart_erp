package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.Specialization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpecializationRepo extends JpaRepository<Specialization,Long> {
    List<Specialization> findByIdIn(List<Long> ids);
}
