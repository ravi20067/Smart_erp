package com.Smart.Erp.Modules.Student.Entity;


import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Student.DTO.Student.StudentResponse;
import com.Smart.Erp.Modules.User.Entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.apache.commons.lang3.builder.ToStringExclude;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "students")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)

@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Student  extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(
            name = "registration_number",
            nullable = false,
            unique = true,
            updatable = false
    )
    private String registrationNumber;

    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true
    )
    private User user;

    @ToStringExclude
    @Builder.Default
    @OneToMany(
            mappedBy = "student",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<StudentEnrollment> enrollments = new ArrayList<>();

    public void addEnrollment(StudentEnrollment enrollment) {
        enrollments.add(enrollment);
        enrollment.setStudent(this);
    }

    public void removeEnrollment(StudentEnrollment enrollment) {
        enrollments.remove(enrollment);
        enrollment.setStudent(null);
    }

    public StudentResponse mapToResponse() {
        return StudentResponse.builder()
                .id(this.getId())
                .registrationNumber(this.getRegistrationNumber())
                .basicDetailRequest(this.getUser().getBasicDetail().mapToResponse())
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .createdBy(this.getCreatedBy() != null ? this.getCreatedBy().toCommonDTO() : null)
                .updatedBy(this.getUpdatedBy() != null ? this.getUpdatedBy().toCommonDTO() : null)
                .build();
    }
}
