package com.Smart.Erp.Modules.TimeTable.Entity;


import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "class_sessions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"session_date", "time_slot_id", "room_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClassSession extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timetable_entry_id")
    private TimetableEntry timetableEntry;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "time_slot_id", nullable = false)
    private TimeSlot timeSlot;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_teacher_enrollment_id", nullable = false)
    private TeacherEnrollment assignedTeacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actual_teacher_enrollment_id")
    private TeacherEnrollment actualTeacher;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SessionStatus status = SessionStatus.SCHEDULED;

    public enum SessionStatus {
        SCHEDULED, COMPLETED, SUBSTITUTED, CANCELLED_HOLIDAY, SUSPENDED
    }
}
