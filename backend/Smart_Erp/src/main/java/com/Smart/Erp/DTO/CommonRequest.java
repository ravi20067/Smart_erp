package com.Smart.Erp.DTO;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class CommonRequest {
    private String name;
    private String code;
}
