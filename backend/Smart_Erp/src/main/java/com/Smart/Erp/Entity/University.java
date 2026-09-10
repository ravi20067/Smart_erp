package com.Smart.Erp.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;


@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class University {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    // University → Users

    @Builder.Default
    @OneToMany(
            mappedBy = "university",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<User> users = new ArrayList<>();
    // University → Academic Years
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

    @OneToOne
    @JoinColumn(name = "dean_id")
    private Teacher dean;
}
