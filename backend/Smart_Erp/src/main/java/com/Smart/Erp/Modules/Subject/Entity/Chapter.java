package com.Smart.Erp.Modules.Subject.Entity;



import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Exam.Entity.ExamResult;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chapters")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chapter extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String chapterName;

    private Integer chapterNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    private Assignment assignment;

    @Builder.Default
    @OneToMany(
            mappedBy = "chapter",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<MiniChapter> miniChapters = new ArrayList<>();
}
