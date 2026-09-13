package com.Smart.Erp.Modules.TimeTable.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Teacher.Entity.TeacherEnrollment;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "teacher_substitutions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeacherSubstitution extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "class_session_id", nullable = false)
    private ClassSession classSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "original_teacher_enrollment_id", nullable = false)
    private TeacherEnrollment originalTeacher;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "substitute_teacher_enrollment_id", nullable = false)
    private TeacherEnrollment substituteTeacher;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "reason", length = 255)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SubstitutionStatus status = SubstitutionStatus.REQUESTED;

    public enum SubstitutionStatus {
        REQUESTED, APPROVED, REJECTED
    }
}

