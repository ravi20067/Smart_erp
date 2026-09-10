package com.Smart.Erp.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;




@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class School implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id")
    private AcademicYear academicYear;

    @Builder.Default
    @OneToMany(
            mappedBy = "school",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Department> departments = new ArrayList<>();

    // Assignment only
    @ManyToOne
    @JoinColumn(name = "school_dean_id")
    private Teacher schoolDean;

    public String getPrefix(){
        return this.academicYear.getCode();
    }
}
