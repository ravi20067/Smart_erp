package com.Smart.Erp.Modules.Finance.Enum;


import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeEnumResponse;
import lombok.Getter;

import java.util.Arrays;
import java.util.List;

@Getter
public enum FeeCategoryType {
    TUITION,
    ADMISSION,
    EXAMINATION,
    LABORATORY,
    LIBRARY,
    SPORTS,
    TRANSPORT,
    HOSTEL,
    MISCELLANEOUS;

    private final String displayName;

    FeeCategoryType() {
        this.displayName = this.name().charAt(0) + this.name().substring(1).toLowerCase();
    }

    public static List<FeeEnumResponse.EnumResponse> buildFeeCategoryTypeEnum() {
        return Arrays.stream(FeeCategoryType.values())
                .map(feeCategoryType -> FeeEnumResponse.EnumResponse.builder()
                        .name(feeCategoryType.name())
                        .enumValue(feeCategoryType.name())
                        .build())
                .toList();
    }
}
