package com.Smart.Erp.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "scholarships")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Scholarship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    private Double amount;

    @ToString.Exclude
    @ManyToMany(mappedBy = "scholarships")
    private List<Student> students = new ArrayList<>();
}
