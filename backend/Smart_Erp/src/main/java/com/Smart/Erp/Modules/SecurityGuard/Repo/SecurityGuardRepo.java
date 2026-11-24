package com.Smart.Erp.Modules.SecurityGuard.Repo;

import com.Smart.Erp.Modules.SecurityGuard.Entity.SecurityGuard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecurityGuardRepo extends JpaRepository<SecurityGuard, Long> {
    Optional<SecurityGuard> findByUserId(Long userId);
    Optional<SecurityGuard> findByBadgeNumber(String badgeNumber);
    boolean existsByBadgeNumber(String badgeNumber);
    List<SecurityGuard> findByUser_University_Id(Long universityId);
}
