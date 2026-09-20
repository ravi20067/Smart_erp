package com.Smart.Erp.Modules.Academic.DTO.University;

import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import lombok.Data;

@Data
public class UniversityUpdateRequest {
    private String name;
    private ActiveStatus activeStatus;
}
