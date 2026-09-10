package com.Smart.Erp.Entity;

import com.Smart.Erp.DTO.CommonDTO;

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
