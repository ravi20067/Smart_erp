package com.Smart.Erp.Modules.AI.Metadata;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RelationshipMetadata {
    private String tableName;
    private String columnName;
    private String referencedTableName;
    private String referencedColumnName;
}
