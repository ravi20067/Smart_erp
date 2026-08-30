package com.Smart.Erp.DTO.Admin.Department;

import com.Smart.Erp.DTO.CommonDTO;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DepartmentResponse {
    private Long id;
    private String name;
    private String code;
    private List<CommonDTO> courses;
    private CommonDTO hod;
}
