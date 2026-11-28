package com.Smart.Erp.Modules.AI.Metadata;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatabaseSchemaMetadata {
    private String schemaName;
    private Instant discoveredAt;
    private String schemaSignature;
    @Builder.Default
    private Map<String, TableMetadata> tables = new LinkedHashMap<>();
    @Builder.Default
    private List<RelationshipMetadata> relationships = List.of();
}
