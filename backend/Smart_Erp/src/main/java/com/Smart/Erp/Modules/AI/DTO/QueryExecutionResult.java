package com.Smart.Erp.Modules.AI.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueryExecutionResult {
    @Builder.Default
    private List<String> columns = new ArrayList<>();
    @Builder.Default
    private List<Map<String, Object>> rows = new ArrayList<>();
    private int rowCount;
    private long durationMs;
    private boolean truncated;
}
