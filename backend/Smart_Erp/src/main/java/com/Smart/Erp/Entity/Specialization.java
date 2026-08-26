package com.Smart.Erp.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Specialization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code;

    @ManyToMany(mappedBy = "specializations")
    private List<CourseSubject> courseSubjects = new ArrayList<>();

    @OneToMany(mappedBy = "specialization")
    private List<SectionGroup> sectionGroups = new ArrayList<>();
}
