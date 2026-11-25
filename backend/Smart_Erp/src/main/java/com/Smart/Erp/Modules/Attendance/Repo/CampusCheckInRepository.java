package com.Smart.Erp.Modules.Attendance.Repo;

import com.Smart.Erp.Modules.Attendance.Entity.CampusCheckInRecord;
import com.Smart.Erp.Modules.Attendance.Enum.CampusCheckDirection;
import com.Smart.Erp.Modules.Attendance.Enum.GuardCheckInState;
import com.Smart.Erp.Modules.Student.Entity.Student;
import com.Smart.Erp.Modules.User.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampusCheckInRepository extends JpaRepository<CampusCheckInRecord, Long> {

    Optional<CampusCheckInRecord> findByQrToken(String qrToken);

    Optional<CampusCheckInRecord> findFirstByUserAndDirectionAndStatusAndCheckedOutFalseOrderByActionTimeDesc(
            User user, CampusCheckDirection direction, GuardCheckInState status
    );

    boolean existsByUserAndDirectionAndStatusAndCheckedOutFalse(
            User user, CampusCheckDirection direction, GuardCheckInState status
    );

    Optional<CampusCheckInRecord> findFirstByStudentAndDirectionAndStatusAndCheckedOutFalseOrderByActionTimeDesc(
            Student student, CampusCheckDirection direction, GuardCheckInState status
    );

    boolean existsByStudentAndDirectionAndStatusAndCheckedOutFalse(
            Student student, CampusCheckDirection direction, GuardCheckInState status
    );

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM CampusCheckInRecord c WHERE c.linkedCheckIn = :linkedCheckIn AND c.status = :status")
    boolean existsByLinkedCheckInAndStatus(
            @Param("linkedCheckIn") CampusCheckInRecord linkedCheckIn,
            @Param("status") GuardCheckInState status
    );

    List<CampusCheckInRecord> findAllByUserAndDirectionAndStatus(
            User user, CampusCheckDirection direction, GuardCheckInState status
    );

    List<CampusCheckInRecord> findAllByUserOrderByRequestedAtDesc(User user);

    List<CampusCheckInRecord> findTop100ByOrderByRequestedAtDesc();
}
