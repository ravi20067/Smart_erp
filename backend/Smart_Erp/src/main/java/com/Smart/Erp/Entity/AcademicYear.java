package com.Smart.Erp.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "academic_years",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "name")
        }
)
@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String code;

    private LocalDate startDate;

    private LocalDate endDate;

    private Boolean current = false;

    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id")
    private University university;

    @Builder.Default
    @OneToMany(
            mappedBy = "academicYear",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<School> schools = new ArrayList<>();

}
