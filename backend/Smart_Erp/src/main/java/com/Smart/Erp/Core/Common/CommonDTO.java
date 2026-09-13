package com.Smart.Erp.Core.Common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommonDTO {
    private Long id;
    private String name;
    private String code;
}
