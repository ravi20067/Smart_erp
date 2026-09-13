package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Student.Entity.StudentEnrollment;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "class_session_participants", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"class_session_id", "student_enrollment_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClassSessionParticipant extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "class_session_id", nullable = false)
    private ClassSession classSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_enrollment_id", nullable = false)
    private StudentEnrollment studentEnrollment;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 20)
    private AttendanceStatus attendanceStatus = AttendanceStatus.PENDING;

    public enum AttendanceStatus {
        PENDING, PRESENT, ABSENT, LATE, EXCUSED
    }
}

