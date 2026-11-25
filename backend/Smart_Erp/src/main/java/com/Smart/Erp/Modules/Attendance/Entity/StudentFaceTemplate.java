package com.Smart.Erp.Modules.Attendance.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.Student.Entity.Student;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "student_face_templates",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_student_face_template", columnNames = {"student_id"})
        },
        indexes = {
                @Index(name = "idx_sft_student", columnList = "student_id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentFaceTemplate extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false, unique = true)
    private Student student;

    @Column(name = "encrypted_embedding", nullable = false, columnDefinition = "TEXT")
    private String encryptedEmbedding;

    @Column(name = "embedding_dimension", nullable = false)
    @Builder.Default
    private int embeddingDimension = 128;

    @Column(name = "algorithm", nullable = false, length = 32)
    @Builder.Default
    private String algorithm = "SFACE";

    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "enrolled_at", nullable = false)
    private LocalDateTime enrolledAt;
}
