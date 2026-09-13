package com.Smart.Erp.Modules.Teacher.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.User.Entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "teachers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Teacher extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ToString.Exclude
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ToString.Exclude
    @OneToMany(
            mappedBy = "teacher",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<TeacherEnrollment> enrollments = new ArrayList<>();

    public void addEnrollment(TeacherEnrollment enrollment) {
        enrollments.add(enrollment);
        enrollment.setTeacher(this);
    }

    public void removeEnrollment(TeacherEnrollment enrollment) {
        enrollments.remove(enrollment);
        enrollment.setTeacher(null);
    }
}
