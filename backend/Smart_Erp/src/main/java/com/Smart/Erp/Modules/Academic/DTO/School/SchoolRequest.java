package com.Smart.Erp.Modules.Academic.DTO.School;

import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchoolRequest {
    private Long id;
    private String name;
    private String code;
    private ActiveStatus activeStatus;
}
