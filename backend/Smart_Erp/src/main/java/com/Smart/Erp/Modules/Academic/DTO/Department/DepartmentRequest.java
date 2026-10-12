package com.Smart.Erp.Modules.Academic.DTO.Department;

import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DepartmentRequest {
    private Long id;
    private String name;
    private String code;
    private ActiveStatus activeStatus;
}
