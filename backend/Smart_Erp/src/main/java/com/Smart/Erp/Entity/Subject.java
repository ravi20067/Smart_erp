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
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String subjectName;

    private String subjectCode;

    @OneToMany(
            mappedBy = "subject",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<ExamResult> examResults = new ArrayList<>();


    // Subject → Chapters
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
    private List<Teacher> teachers = new ArrayList<>();


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
