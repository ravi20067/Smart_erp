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

    private String employeeId;

    @Enumerated(EnumType.STRING)
    private Status status;

    @ToString.Exclude
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "mentor")
    private List<Section> classesAsMentor = new ArrayList<>();

    // Teacher → Subjects
    @ManyToMany(mappedBy = "teachers")
    private List<Subject> subjects = new ArrayList<>();
}
