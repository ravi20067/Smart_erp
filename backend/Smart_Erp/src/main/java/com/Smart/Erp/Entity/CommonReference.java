package com.Smart.Erp.Entity;

import com.Smart.Erp.DTO.CommonDTO;

public interface CommonReference {
    Long getId();
    String getName();
    String getCode();

    default CommonDTO toCommonDTO() {
        return new CommonDTO(
                getId(),
                getName(),
                getCode()
        );
    }
}
