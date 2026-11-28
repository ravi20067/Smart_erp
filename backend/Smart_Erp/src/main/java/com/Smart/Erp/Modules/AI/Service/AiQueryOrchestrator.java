package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.DTO.*;
import com.Smart.Erp.Modules.AI.Exception.AiQueryException;
import com.Smart.Erp.Modules.AI.Exception.SqlValidationException;
import com.Smart.Erp.Modules.AI.Metadata.TableMetadata;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Central orchestrator for the Smart ERP Multilingual AI Database Query & Execution pipeline.
 * Coordinates identity resolution, permission/scope checks, schema discovery, SQLCoder SQL generation,
 * JSqlParser AST validation, server-side scope enforcement, read-only execution,
 * Qwen multilingual response generation, and audit logging.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiQueryOrchestrator {

    private final UserContextService userContextService;
    private final IntentDetectionService intentDetectionService;
    private final SchemaMetadataService schemaMetadataService;
    private final SqlGenerationService sqlGenerationService;
    private final SqlValidationService sqlValidationService;
    private final QueryScopeEnforcementService scopeEnforcementService;
    private final SqlExecutionService sqlExecutionService;
    private final ResponseGenerationService responseGenerationService;
    private final AiQueryAuditService auditService;
    private final AiQueryRateLimiter rateLimiter;

    public AiQueryResponse processQuery(AiQueryRequest request) {
        String conversationId = (request.getConversationId() != null && !request.getConversationId().isBlank())
                ? request.getConversationId()
                : UUID.randomUUID().toString();

        String originalMessage = request.getMessage() == null ? "" : request.getMessage().trim();
        String language = intentDetectionService.detectLanguage(originalMessage, request.getLanguage());
        String intent = intentDetectionService.detectIntent(originalMessage);

        UserQueryContext context = null;
        String auditedSql = null;
        Set<String> tablesAccessed = Set.of();

        try {
            // 1. Resolve authenticated user context & permissions from SecurityContext
            context = userContextService.resolveCurrentUserContext();

            // 2. Rate limiting
            if (!rateLimiter.allowRequest(context.getUserId())) {
                auditService.record(context, originalMessage, language, intent, null,
                        tablesAccessed, false, "RATE_LIMITED", 0L, 0, "RATE_LIMIT_EXCEEDED");
                return errorResponse(conversationId, language, intent, "RATE_LIMIT_EXCEEDED",
                        "Too many AI requests. Please wait a moment and try again.");
            }

            // 3. Prompt-injection & clarification checks
            if (intentDetectionService.isPromptInjectionAttempt(originalMessage)) {
                auditService.record(context, originalMessage, language, intent, null,
                        tablesAccessed, false, "BLOCKED", 0L, 0, "PROMPT_INJECTION_BLOCKED");
                return errorResponse(conversationId, language, intent, "ACCESS_DENIED",
                        "You are not authorized to perform that operation.");
            }

            String clarification = intentDetectionService.checkClarificationNeeded(originalMessage);
            if (clarification != null) {
                auditService.record(context, originalMessage, language, intent, null,
                        tablesAccessed, true, "CLARIFICATION_REQUIRED", 0L, 0, null);
                return AiQueryResponse.builder()
                        .success(true)
                        .conversationId(conversationId)
                        .language(language)
                        .intent(intent)
                        .requiresClarification(true)
                        .message(clarification)
                        .build();
            }

            // 4. Schema discovery (cached, relevant authorized tables only)
            List<TableMetadata> authorizedTables = schemaMetadataService.selectRelevantAuthorizedTables(
                    originalMessage, context.getAllowedTables());
            if (authorizedTables.isEmpty()) {
                auditService.record(context, originalMessage, language, intent, null,
                        tablesAccessed, false, "DENIED", 0L, 0, "NO_AUTHORIZED_SCHEMA");
                return errorResponse(conversationId, language, intent, "ACCESS_DENIED",
                        "You are not authorized to access this information.");
            }

            // 5. Generate SQL using SQLCoder
            GeneratedSqlDto generated = sqlGenerationService.generateSql(
                    originalMessage, language, intent, context, authorizedTables);
            auditedSql = generated.getSql();

            // 6. AST validation & table authorization
            SqlValidationService.ValidationOutcome validation =
                    sqlValidationService.validate(generated.getSql(), context);
            tablesAccessed = validation.ast().referencedTables();

            if (!validation.authorizationResult().isAuthorized()) {
                auditService.record(context, originalMessage, language, intent, auditedSql,
                        tablesAccessed, false, "DENIED", 0L, 0, validation.authorizationResult().getReason());
                return errorResponse(conversationId, language, intent, "ACCESS_DENIED",
                        "You are not authorized to access this information.");
            }

            // 7. Server-controlled data scope enforcement
            QueryScopeEnforcementService.ScopedSql scopedSql =
                    scopeEnforcementService.enforceScope(validation.ast().plainSelect(), context);
            auditedSql = scopedSql.sql();

            // 8. Execute approved read-only SQL
            QueryExecutionResult executionResult = sqlExecutionService.executeReadOnly(
                    scopedSql.sql(), scopedSql.parameters(), validation.authorizationResult());

            // 9. Generate natural-language multilingual response
            String answer = responseGenerationService.generateResponse(
                    originalMessage, language, intent, executionResult);

            auditService.record(context, originalMessage, language, intent, auditedSql,
                    tablesAccessed, true, "SUCCESS",
                    executionResult.getDurationMs(), executionResult.getRowCount(), null);

            Object dataPayload = executionResult.getRowCount() == 1 && !executionResult.getRows().isEmpty()
                    ? executionResult.getRows().get(0)
                    : executionResult.getRows();

            return AiQueryResponse.builder()
                    .success(true)
                    .conversationId(conversationId)
                    .language(language)
                    .intent(intent)
                    .message(answer)
                    .data(dataPayload)
                    .visualization(AiQueryResponse.VisualizationDto.builder()
                            .type("TABLE")
                            .columns(executionResult.getColumns())
                            .rows(executionResult.getRows())
                            .build())
                    .execution(AiQueryResponse.ExecutionDto.builder()
                            .executed(true)
                            .readOnly(true)
                            .rowCount(executionResult.getRowCount())
                            .durationMs(executionResult.getDurationMs())
                            .build())
                    .build();

        } catch (SqlValidationException ex) {
            log.warn("SQL validation/scope blocked query for user {}: {} - {}",
                    context != null ? context.getUsername() : "anonymous", ex.getErrorCode(), ex.getMessage());
            auditService.record(context, originalMessage, language, intent, auditedSql,
                    tablesAccessed, false, "VALIDATION_FAILED", 0L, 0, ex.getErrorCode());
            return errorResponse(conversationId, language, intent, "ACCESS_DENIED",
                    "I could not safely process that query within your authorized permissions.");
        } catch (AiQueryException ex) {
            log.warn("AI query failed for user {}: {} - {}",
                    context != null ? context.getUsername() : "anonymous", ex.getErrorCode(), ex.getMessage());
            auditService.record(context, originalMessage, language, intent, auditedSql,
                    tablesAccessed, false, "FAILED", 0L, 0, ex.getErrorCode());
            String safeMessage = "UNAUTHORIZED".equals(ex.getErrorCode()) || "ACCESS_DENIED".equals(ex.getErrorCode())
                    ? "You are not authorized to access this information."
                    : ex.getMessage();
            return errorResponse(conversationId, language, intent, ex.getErrorCode(), safeMessage);
        } catch (Exception ex) {
            log.error("Unexpected error in AI query orchestrator", ex);
            auditService.record(context, originalMessage, language, intent, auditedSql,
                    tablesAccessed, false, "ERROR", 0L, 0, "INTERNAL_ERROR");
            return errorResponse(conversationId, language, intent, "INTERNAL_ERROR",
                    "Unable to process your request right now. Please try again.");
        }
    }

    private AiQueryResponse errorResponse(
            String conversationId,
            String language,
            String intent,
            String errorCode,
            String message
    ) {
        return AiQueryResponse.builder()
                .success(false)
                .conversationId(conversationId)
                .language(language)
                .intent(intent)
                .errorCode(errorCode)
                .message(message)
                .execution(AiQueryResponse.ExecutionDto.builder()
                        .executed(false)
                        .readOnly(true)
                        .build())
                .build();
    }
}
