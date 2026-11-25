package com.Smart.Erp.Modules.Attendance.Repo;

import com.Smart.Erp.Modules.Attendance.Entity.QRTokenUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QRTokenUsageRepository extends JpaRepository<QRTokenUsage, Long> {
    Optional<QRTokenUsage> findByTokenNonce(String tokenNonce);

    boolean existsByTokenNonce(String tokenNonce);
}
