package com.Smart.Erp.Entity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "subjects")
@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class Subject implements CommonReference{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String code;

    private Integer lecturesPerWeek;

    private Boolean isPracticalSubject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToMany
    @JoinTable(
            name = "subject_specializations",
            joinColumns = @JoinColumn(name = "subject_id"),
            inverseJoinColumns = @JoinColumn(name = "specialization_id"),
            uniqueConstraints = {
                    @UniqueConstraint(
                            name = "uk_subject_specialization",
                            columnNames = {
                                    "subject_id",
                                    "specialization_id"
                            }
                    )
            }
    )
    @Builder.Default
    private List<Specialization> specializations = new ArrayList<>();

    @Builder.Default
    @OneToMany(
            mappedBy = "subject",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<ExamResult> examResults = new ArrayList<>();


    // Subject → Chapters
    @Builder.Default
    @OneToMany(
            mappedBy = "subject",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Chapter> chapters = new ArrayList<>();


    // Subject ↔ Teachers
    @ManyToMany
    @JoinTable(
            name = "subject_teachers",
            joinColumns = @JoinColumn(name = "subject_id"),
            inverseJoinColumns = @JoinColumn(name = "teacher_id")
    )
    private List<Teacher> subjectTeachers = new ArrayList<>();


    // Teacher assigned for question bank
    @OneToOne
    @JoinColumn(name = "question_bank_teacher_id")
    private Teacher questionBankTeacher;

    private LocalDate lastDateQuestionBankSummit;


    // Teacher assigned for study material
    @OneToOne
    @JoinColumn(name = "study_material_teacher_id")
    private Teacher studyMaterialTeacher;

    private LocalDate lastDateStudyMaterialSummit;
}
