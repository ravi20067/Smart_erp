package com.Smart.Erp.Modules.AI.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QueryAuthorizationResult {
    private boolean authorized;
    private boolean readOnly;
    private boolean scopeValidated;
    private String reason;

    public static QueryAuthorizationResult allowed() {
        return QueryAuthorizationResult.builder()
                .authorized(true)
                .readOnly(true)
                .scopeValidated(true)
                .reason(null)
                .build();
    }

    public static QueryAuthorizationResult denied(String reason) {
        return QueryAuthorizationResult.builder()
                .authorized(false)
                .readOnly(true)
                .scopeValidated(false)
                .reason(reason)
                .build();
    }
}
