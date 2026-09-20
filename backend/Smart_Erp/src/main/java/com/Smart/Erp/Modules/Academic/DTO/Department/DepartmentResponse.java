package com.Smart.Erp.Modules.Academic.DTO.Department;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
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
    private CommonDTO school;
    private ActiveStatus activeStatus;
    private CommonDTO academicYear;
}
