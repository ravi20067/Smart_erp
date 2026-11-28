package com.Smart.Erp.Modules.AI.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "ai_query_audit_logs",
        indexes = {
                @Index(name = "idx_ai_audit_user", columnList = "user_id"),
                @Index(name = "idx_ai_audit_university", columnList = "university_id"),
                @Index(name = "idx_ai_audit_created", columnList = "created_at")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiQueryAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username", length = 128)
    private String username;

    @Column(name = "user_role", length = 64)
    private String userRole;

    @Column(name = "university_id")
    private Long universityId;

    @Column(name = "original_request", length = 2000)
    private String originalRequest;

    @Column(name = "detected_language", length = 32)
    private String detectedLanguage;

    @Column(name = "intent", length = 64)
    private String intent;

    @Column(name = "generated_sql", length = 4000)
    private String generatedSql;

    @Column(name = "tables_accessed", length = 512)
    private String tablesAccessed;

    @Column(name = "authorized")
    private boolean authorized;

    @Column(name = "execution_status", length = 64)
    private String executionStatus;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "row_count")
    private Integer rowCount;

    @Column(name = "error_category", length = 128)
    private String errorCategory;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
