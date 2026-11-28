package com.Smart.Erp.Modules.AI.Metadata;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ColumnMetadata {
    private String name;
    private String columnType;
    private boolean nullable;
    private boolean primaryKey;
    private String columnKey;
    private boolean sensitive;
}
