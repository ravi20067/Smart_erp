package com.Smart.Erp.Modules.Subject.Entity;


import com.Smart.Erp.Config.BaseAuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mini_chapters")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MiniChapter  extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private Integer sequenceNumber;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id")
    private Chapter chapter;


    @Builder.Default
    @OneToMany(
            mappedBy = "miniChapter",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Question> questions = new ArrayList<>();


    @Builder.Default
    @OneToMany(
            mappedBy = "miniChapter",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<StudyMaterial> studyMaterials = new ArrayList<>();
}
