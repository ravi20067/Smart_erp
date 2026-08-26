package com.Smart.Erp.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "course_subjects",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_course_subject",
                        columnNames = {"course_id", "subject_id"}
                )
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSubject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Integer lecturesPerWeek;
    private Integer lectureDurationMinutes;
    private Boolean isPracticalSubject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @OneToOne
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToMany
    @JoinTable(
            name = "course_subject_specializations",
            joinColumns = @JoinColumn(name = "course_subject_id"),
            inverseJoinColumns = @JoinColumn(name = "specialization_id"),
            uniqueConstraints = {
                    @UniqueConstraint(
                            name = "uk_course_subject_specialization",
                            columnNames = {
                                    "course_subject_id",
                                    "specialization_id"
                            }
                    )
            }
    )
    @Builder.Default
    private List<Specialization> specializations = new ArrayList<>();
}
