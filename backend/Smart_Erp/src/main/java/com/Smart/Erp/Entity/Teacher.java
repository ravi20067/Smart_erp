package com.Smart.Erp.Entity;

import com.Smart.Erp.Enum.Status;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "teachers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Teacher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Status status;

    @ToString.Exclude
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Builder.Default
    @OneToMany(mappedBy = "mentor")
    private List<Section> classesAsMentor = new ArrayList<>();

    // Teacher → Subjects
    @Builder.Default
    @ManyToMany(mappedBy = "subjectTeachers")
    private List<Subject> subjects = new ArrayList<>();
}
