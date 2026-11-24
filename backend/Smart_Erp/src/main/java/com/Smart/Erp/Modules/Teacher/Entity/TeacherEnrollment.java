package com.Smart.Erp.Modules.Teacher.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Teacher.DTO.Enrollment.TeacherEnrollmentResponse;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.Subject.Entity.Subject;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@Builder
@Entity
@Table(
    name = "teacher_enrollment",
    indexes = {
            @Index(name = "idx_teacher_enrollment_teacher", columnList = "teacher_id")
    }
)
@AllArgsConstructor
@NoArgsConstructor
public class TeacherEnrollment  extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    /**
     * Teacher associated with this enrollment.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "teacher_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_teacher_enrollment_teacher")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Teacher teacher;

    /**
     * Enrollment lifecycle.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    /**
     * Subjects assigned to this teacher enrollment.
     */
    @Builder.Default
    @ManyToMany(mappedBy = "subjectTeachers")
    @ToString.Exclude
    private Set<Subject> subjects = new HashSet<>();

    public void addSubject(Subject subject) {
        subjects.add(subject);
        subject.getSubjectTeachers().add(this);
    }

    public void removeSubject(Subject subject) {
        subjects.remove(subject);
        subject.getSubjectTeachers().remove(this);
    }

    public TeacherEnrollmentResponse.EnrollmentResponse mapToResponse(List<PermissionAction> permissionActions) {
        return TeacherEnrollmentResponse.EnrollmentResponse.builder()
                .id(this.id)
                .status(this.status)
                .subjects(this.subjects.stream()
                        .map(CommonReference::toCommonDTO)
                        .toList())
                .permissionActions(permissionActions)
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .createdBy(this.getCreatedBy() == null ? null : this.getCreatedBy().toCommonDTO())
                .updatedBy(this.getUpdatedBy() == null ? null : this.getUpdatedBy().toCommonDTO())
                .build();
    }
}