package com.Smart.Erp.Modules.Academic.Entity;

import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.DTO.University.UniversityResponse;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.Finance.Entity.Scholarship;
import com.Smart.Erp.Modules.User.Entity.Role;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(onlyExplicitlyIncluded = true)
public class University implements CommonReference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    @Column(unique = true)
    private String code;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    private ActiveStatus activeStatus = ActiveStatus.DISABLE;

    @Builder.Default
    @OneToMany(
            mappedBy = "university",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<User> users = new ArrayList<>();

    @OneToMany(
            mappedBy = "university",
            fetch = FetchType.LAZY
    )
    @ToString.Exclude
    @Builder.Default
    private List<Role> roles = new ArrayList<>();

    @Builder.Default
    @OneToMany(
            mappedBy = "university",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<AcademicYear> academicYears = new ArrayList<>();

    @Builder.Default
    @OneToMany(
            mappedBy = "university",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Scholarship> scholarships = new ArrayList<>();

    @Override
    public String getCode() {
        return this.code;
    }

    @Override
    public String getPrefix() {
        return code;
    }

    public UniversityResponse mapToResponse() {
        long totalUser = 0L;
        long totalStudent = 0L;
        if (this.getUsers() != null &&
                !this.getUsers().isEmpty()) {
            totalUser = this.getUsers().size();
            totalStudent = this.getUsers().stream()
                    .filter(
                            x ->
                                    x.getUserRole() == UserRoles.STUDENT
                    ).count();
        }
        return UniversityResponse.builder()
                .id(this.getId())
                .name(this.getName())
                .code(this.getCode())
                .activeStatus(this.getActiveStatus())
                .noOfStudent(totalStudent)
                .noOfTeacher(totalUser - totalStudent)
                .noOfUser(totalUser)
                .build();
    }
}
