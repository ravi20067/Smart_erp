package com.Smart.Erp.Modules.Academic.DTO.Department;

import com.Smart.Erp.Core.Common.CommonDTO;
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
