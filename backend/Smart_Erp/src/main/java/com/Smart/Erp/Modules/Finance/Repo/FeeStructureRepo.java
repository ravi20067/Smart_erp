package com.Smart.Erp.Modules.Finance.Repo;

import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface FeeStructureRepo extends JpaRepository<FeeStructure, Long> {
    Optional<FeeStructure> findByCourse_Id(Long courseId);
}
