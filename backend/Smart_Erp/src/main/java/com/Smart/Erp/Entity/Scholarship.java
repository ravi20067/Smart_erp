package com.Smart.Erp.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "scholarships")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Scholarship implements CommonReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;
    private String name;
    private String code;
    private String description;
    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    @ToString.Exclude
    @ManyToMany(mappedBy = "scholarships")
    private Set<StudentEnrollment> students = new HashSet<>();

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id")
    private University university;

    @Override
    public String getPrefix() {
        return "";
    }
}
