package com.Smart.Erp.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Specialization implements CommonReference{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code = "";

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @Builder.Default
    @ToString.Exclude
    @ManyToMany(mappedBy = "specializations")
    private List<Subject> subjects = new ArrayList<>();

    @Builder.Default
    @ToString.Exclude
    @OneToMany(mappedBy = "specialization")
    private List<SectionGroup> sectionGroups = new ArrayList<>();

    public String getPrefix(){
        return this.getCourse().getPrefix() + this.getCourse().getPrefix();
    }
}
