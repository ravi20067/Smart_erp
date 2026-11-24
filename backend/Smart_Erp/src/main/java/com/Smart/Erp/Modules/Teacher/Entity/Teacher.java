package com.Smart.Erp.Modules.Teacher.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Teacher.DTO.Enrollment.TeacherEnrollmentResponse;
import com.Smart.Erp.Modules.Teacher.DTO.Role.TeacherRoleResponse;
import com.Smart.Erp.Modules.Teacher.DTO.Role.UserRoleResponse;
import com.Smart.Erp.Modules.Teacher.DTO.Teacher.TeacherResponse;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
@Entity
@Table(name = "teachers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Teacher extends BaseAuditableEntity implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
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
    @Builder.Default
    private List<TeacherEnrollment> enrollments = new ArrayList<>();

    public void addEnrollment(TeacherEnrollment enrollment) {
        enrollments.add(enrollment);
        enrollment.setTeacher(this);
    }

    public void removeEnrollment(TeacherEnrollment enrollment) {
        enrollments.remove(enrollment);
        enrollment.setTeacher(null);
    }

    @Override
    public String getName() {
        return this.user != null ? this.user.getBasicDetail().getFirstName() + " " + this.user.getBasicDetail().getLastName() : "";
    }

    @Override
    public String getCode() {
        return this.user != null ? this.user.getUsername() : "";
    }


    @Override
    public void setCodeWithPrefix(String code) {

    }

    public TeacherResponse mapToResponse(List<PermissionAction> permissionActions) {
        return TeacherResponse.builder()
                .id(this.getId())
                .basicDetailRequest(this.getUser().getBasicDetail().mapToResponse())
                .permissionActions(permissionActions)
                .subjects(
                        this.getEnrollments().stream()
                                .filter(Objects::nonNull)
                                .filter(teacherEnrollment -> teacherEnrollment.getStatus() == EnrollmentStatus.ACTIVE)
                                .flatMap(teacherEnrollment ->
                                        teacherEnrollment.getSubjects().stream()
                                                .map(CommonReference::toCommonDTO)
                                )
                                .toList()
                )
                .university(this.getUser().getUniversity().toCommonDTO())
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .createdBy(this.getCreatedBy() != null
                        ? this.getCreatedBy().toCommonDTO()
                        : null)
                .updatedBy(this.getUpdatedBy() != null
                        ? this.getUpdatedBy().toCommonDTO()
                        : null)
                .build();
    }

    public TeacherEnrollmentResponse mapToEnrollmentResponse(List<PermissionAction> permissionActions) {
        return TeacherEnrollmentResponse.builder()
                .teacher(this.toCommonDTO())
                .enrollmentResponses(
                        this.getEnrollments().stream()
                                .map(enrollment -> enrollment.mapToResponse(permissionActions))
                                .toList()
                )
                .university(this.getUser().getUniversity().toCommonDTO())
                .build();
    }

    public UserRoleResponse mapToUserRoleResponse(
            List<PermissionAction> permissionActions
    ) {

        List<TeacherRoleResponse> roleResponses = new ArrayList<>();

        this.getUser().getRoles().forEach(userRole -> {

            if (userRole == null || userRole.getRole() == null) {
                return;
            }

            TeacherRoleResponse response = TeacherRoleResponse.builder()
                    .id(userRole.getId())
                    .name(userRole.getRole().getName())
                    .description(userRole.getRole().getDescription())
                    .enumValue(userRole.getRole().getUserRole())
                    .active(userRole.getActive())
                    .createdAt(userRole.getCreatedAt())
                    .updatedAt(userRole.getUpdatedAt())
                    .createdBy(
                            userRole.getCreatedBy() != null
                                    ? userRole.getCreatedBy().toCommonDTO()
                                    : null
                    )
                    .updatedBy(
                            userRole.getUpdatedBy() != null
                                    ? userRole.getUpdatedBy().toCommonDTO()
                                    : null
                    )
                    .build();

            roleResponses.add(response);
        });

        return UserRoleResponse.builder()
                .teacherId(this.getId())
                .user(this.getUser().toCommonDTO())
                .permissionActions(permissionActions)
                .roles(roleResponses)
                .build();
    }
}
