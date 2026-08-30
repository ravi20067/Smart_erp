package com.Smart.Erp.DTO.Admin.Department;

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
    private Long hodId;
}
