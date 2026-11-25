package com.Smart.Erp.Modules.Attendance.Repo;

import com.Smart.Erp.Modules.Attendance.Entity.FaceVerificationAttempt;
import com.Smart.Erp.Modules.Attendance.Entity.FaceVerificationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaceVerificationAttemptRepository extends JpaRepository<FaceVerificationAttempt, Long> {
    List<FaceVerificationAttempt> findAllByVerificationSessionOrderByAttemptNumberAsc(FaceVerificationSession session);
}
