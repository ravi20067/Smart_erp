
package com.Smart.Erp.Modules.Finance.Repo;

import com.Smart.Erp.Modules.Finance.Entity.FeeStructureSpecialization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FeeStructureSpecializationRepository
        extends JpaRepository<FeeStructureSpecialization, Long> {

    boolean existsByAcademicYear_IdAndSpecialization_Id(
            Long academicYearId,
            Long specializationId
    );

    boolean existsByAcademicYear_IdAndSpecialization_IdAndFeeStructure_IdNot(
            Long academicYearId,
            Long specializationId,
            Long feeStructureId
    );

    @Query("""
                SELECT assignment.specialization.id
                FROM FeeStructureSpecialization assignment
                WHERE assignment.academicYear.id = :academicYearId
                AND assignment.specialization.course.id = :courseId
            """)
    List<Long> findAssignedSpecializationIds(
            @Param("academicYearId") Long academicYearId,
            @Param("courseId") Long courseId
    );
}
