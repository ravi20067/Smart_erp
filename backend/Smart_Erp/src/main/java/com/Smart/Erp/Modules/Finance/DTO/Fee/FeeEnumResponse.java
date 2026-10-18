package com.Smart.Erp.Modules.Finance.DTO.Fee;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FeeEnumResponse {

    @Data
    @Builder
    public static class EnumResponse {
        private String name;
        private String enumValue;
    }
    private List<EnumResponse> feeFrequency;
    private List<EnumResponse> feeComponentType;
}
