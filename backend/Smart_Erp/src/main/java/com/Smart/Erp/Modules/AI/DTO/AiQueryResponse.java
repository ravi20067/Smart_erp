package com.Smart.Erp.Modules.AI.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AiQueryResponse {

    private boolean success;
    private String conversationId;
    private String language;
    private String intent;
    private String message;
    private Boolean requiresClarification;
    private String errorCode;
    private Object data;
    private VisualizationDto visualization;
    private ExecutionDto execution;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VisualizationDto {
        private String type;
        private List<String> columns;
        private List<Map<String, Object>> rows;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecutionDto {
        private boolean executed;
        private boolean readOnly;
        private Integer rowCount;
        private Long durationMs;
    }
}
