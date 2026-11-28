package com.Smart.Erp.Modules.AI.Metadata;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableMetadata {
    private String tableName;
    @Builder.Default
    private List<ColumnMetadata> columns = new ArrayList<>();
    @Builder.Default
    private List<RelationshipMetadata> relationships = new ArrayList<>();
    @Builder.Default
    private List<String> indexes = new ArrayList<>();
}
