package com.Smart.Erp.Entity;


import com.Smart.Erp.Enum.Status;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "students")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer rollNumber;

    @Enumerated(EnumType.STRING)
    private Status status;

    @ToString.Exclude
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true
    )
    private User user;

    @ToString.Exclude
    @ManyToMany
    @Builder.Default
    @JoinTable(
            name = "student_section_group",
            joinColumns = @JoinColumn(name = "student_id"),
            inverseJoinColumns = @JoinColumn(name = "section_group_id")
    )
    private List<SectionGroup> sectionGroups = new ArrayList<>();



    @OneToMany(
            mappedBy = "student",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<ExamResult> examResults = new ArrayList<>();


    @ToString.Exclude
    @ManyToMany
    @JoinTable(
            name = "student_scholarship",
            joinColumns = @JoinColumn(name = "student_id"),
            inverseJoinColumns = @JoinColumn(name = "scholarship_id")
    )
    private List<Scholarship> scholarships = new ArrayList<>();
}
