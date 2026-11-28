package com.Smart.Erp.Modules.AI.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedSqlDto {
    private String rawOutput;
    private String sql;
    private String intent;
    @Builder.Default
    private Map<String, Object> parameters = new LinkedHashMap<>();
}
