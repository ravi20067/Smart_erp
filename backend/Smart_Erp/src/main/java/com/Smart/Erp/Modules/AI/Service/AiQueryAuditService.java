package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.DTO.UserQueryContext;
import com.Smart.Erp.Modules.AI.Entity.AiQueryAuditLog;
import com.Smart.Erp.Modules.AI.Repo.AiQueryAuditLogRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiQueryAuditService {

    private final AiQueryAuditLogRepo auditLogRepo;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            UserQueryContext context,
            String originalRequest,
            String language,
            String intent,
            String sql,
            Set<String> tablesAccessed,
            boolean authorized,
            String executionStatus,
            Long durationMs,
            Integer rowCount,
            String errorCategory
    ) {
        try {
            AiQueryAuditLog entry = AiQueryAuditLog.builder()
                    .userId(context != null ? context.getUserId() : null)
                    .username(context != null ? context.getUsername() : "anonymous")
                    .userRole(context != null && context.getRole() != null ? context.getRole().name() : null)
                    .universityId(context != null ? context.getUniversityId() : null)
                    .originalRequest(truncate(originalRequest, 2000))
                    .detectedLanguage(language)
                    .intent(intent)
                    .generatedSql(truncate(sql, 4000))
                    .tablesAccessed(tablesAccessed == null ? null : truncate(String.join(",", tablesAccessed), 512))
                    .authorized(authorized)
                    .executionStatus(executionStatus)
                    .durationMs(durationMs)
                    .rowCount(rowCount)
                    .errorCategory(errorCategory)
                    .build();

            auditLogRepo.save(entry);
        } catch (Exception ex) {
            log.warn("Failed to persist AI query audit log: {}", ex.getMessage());
        }
    }

    private String truncate(String val, int maxLen) {
        if (val == null) return null;
        return val.length() <= maxLen ? val : val.substring(0, maxLen);
    }
}
