package com.Smart.Erp.Config;

import com.Smart.Erp.Core.Common.CommonDTO;

public interface CommonReference {
    Long getId();
    String getName();
    String getCode();
    String getPrefix();

    default CommonDTO toCommonDTO() {
        return new CommonDTO(
                getId(),
                getName(),
                getPrefix()+getCode()
        );
    }
}
