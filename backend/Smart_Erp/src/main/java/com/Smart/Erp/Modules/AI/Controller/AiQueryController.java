package com.Smart.Erp.Modules.AI.Controller;

import com.Smart.Erp.Modules.AI.DTO.AiQueryRequest;
import com.Smart.Erp.Modules.AI.DTO.AiQueryResponse;
import com.Smart.Erp.Modules.AI.DTO.UserQueryContext;
import com.Smart.Erp.Modules.AI.Metadata.DatabaseSchemaMetadata;
import com.Smart.Erp.Modules.AI.Service.AiQueryOrchestrator;
import com.Smart.Erp.Modules.AI.Service.OllamaHealthService;
import com.Smart.Erp.Modules.AI.Service.SchemaMetadataService;
import com.Smart.Erp.Modules.AI.Service.UserContextService;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiQueryController {

    private final AiQueryOrchestrator orchestrator;
    private final OllamaHealthService ollamaHealthService;
    private final SchemaMetadataService schemaMetadataService;
    private final UserContextService userContextService;

    @PostMapping("/query")
    public ResponseEntity<AiQueryResponse> query(@Valid @RequestBody AiQueryRequest request) {
        AiQueryResponse response = orchestrator.processQuery(request);

        if (!response.isSuccess()) {
            if ("UNAUTHORIZED".equals(response.getErrorCode())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            if ("ACCESS_DENIED".equals(response.getErrorCode())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            if ("RATE_LIMIT_EXCEEDED".equals(response.getErrorCode())) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
            }
            if ("OLLAMA_TIMEOUT_OR_UNAVAILABLE".equals(response.getErrorCode())) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
            }
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(ollamaHealthService.checkHealth());
    }

    @PostMapping("/schema/refresh")
    public ResponseEntity<?> refreshSchema() {
        UserQueryContext context = userContextService.resolveCurrentUserContext();
        if (context.getRole() != UserRoles.ADMIN && context.getRole() != UserRoles.SUPER_ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "errorCode", "ACCESS_DENIED",
                            "message", "Only administrators can refresh schema metadata."));
        }
        DatabaseSchemaMetadata metadata = schemaMetadataService.refreshSchemaMetadata();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "schemaName", metadata.getSchemaName(),
                "tableCount", metadata.getTables().size(),
                "discoveredAt", metadata.getDiscoveredAt().toString()
        ));
    }
}
