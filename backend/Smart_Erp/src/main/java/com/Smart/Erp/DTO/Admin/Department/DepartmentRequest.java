package com.Smart.Erp.DTO.Admin.Department;

import com.Smart.Erp.DTO.CommonAcademic.CommonCourseDTO;
import com.Smart.Erp.DTO.CommonAcademic.CommonTeacherDTO;
import lombok.Data;

import java.util.List;

@Data
public class DepartmentRequest {
    private String name;
    private String code;
    private List<Long> coursesId;
    private Long hodId;
}
