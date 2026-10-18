package com.Smart.Erp.Modules.Finance.Enum;

import com.Smart.Erp.Modules.Finance.DTO.Fee.FeeEnumResponse;
import com.Smart.Erp.Modules.User.DTO.Role.UserRoleEnumResponse;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import lombok.Getter;

import java.util.Arrays;
import java.util.List;

@Getter
public enum FeeFrequency {
    ONE_TIME("One Time"),
    ANNUAL("Annual"),
    SEMESTER("Semester"),
    QUARTERLY("Quarterly"),
    MONTHLY("Monthly");

    private final String displayName;

    FeeFrequency(String displayName) {
        this.displayName = displayName;
    }

    public static List<FeeEnumResponse.EnumResponse> buildFeeFrequencyEnum() {
        return Arrays.stream(FeeFrequency.values())
                .map(feeFrequency -> FeeEnumResponse.EnumResponse.builder()
                        .name(feeFrequency.name())
                        .enumValue(feeFrequency.name())
                        .build())
                .toList();
    }
}
