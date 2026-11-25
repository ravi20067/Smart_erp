package com.Smart.Erp.Modules.Finance.Repo;

import com.Smart.Erp.Modules.Finance.Entity.FeeStructure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface FeeStructureRepo extends JpaRepository<FeeStructure, Long> {
    Optional<FeeStructure> findByCourse_Id(Long courseId);

    boolean existsByCourse_IdAndAcademicYear_Id(Long courseId, Long academicYearId);

    boolean existsByCourse_IdAndAcademicYear_IdAndIdNot(Long courseId, Long academicYearId, Long id);

    Optional<FeeStructure> findByCourse_IdAndAcademicYear_Id(Long courseId, Long academicYearId);

    List<FeeStructure> findAllByCourse_IdAndAcademicYear_Id(Long courseId, Long academicYearId);

    List<FeeStructure> findAllByCourse_Id(Long courseId);

}
