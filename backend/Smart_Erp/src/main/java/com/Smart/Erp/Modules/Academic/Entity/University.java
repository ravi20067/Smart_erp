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

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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

    @Builder.Default
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
    private List<School> schools = new ArrayList<>();

    @Builder.Default
    @OneToMany(
            mappedBy = "university",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Scholarship> scholarships = new ArrayList<>();

    @Override
    public void setCodeWithPrefix(String code) {
        this.code = code.toUpperCase(Locale.ROOT);
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
                .school(this.schools.stream()
                        .map(School::toCommonDTO)
                        .toList()
                )
                .build();
    }
}
