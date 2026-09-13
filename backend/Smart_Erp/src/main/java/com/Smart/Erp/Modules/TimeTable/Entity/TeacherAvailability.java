package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "teacher_availabilities", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"teacher_enrollment_id", "date", "time_slot_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeacherAvailability extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_enrollment_id", nullable = false)
    private TeacherEnrollment teacherEnrollment;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "time_slot_id", nullable = false)
    private TimeSlot timeSlot;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", nullable = false, length = 30)
    private AvailabilityStatus availabilityStatus = AvailabilityStatus.AVAILABLE;

    @Column(name = "remarks", length = 255)
    private String remarks;

    public enum AvailabilityStatus {
        AVAILABLE, ON_LEAVE, BUSY_CLASS, BUSY_OTHER_DUTY, UNAVAILABLE
    }
}

