package com.Smart.Erp.DTO.Admin.Department;

import com.Smart.Erp.DTO.CommonAcademic.CommonCourseDTO;
import com.Smart.Erp.DTO.CommonAcademic.CommonTeacherDTO;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DepartmentResponse {
    private Long id;
    private String name;
    private String code;
    private List<CommonCourseDTO> courses;
    private CommonTeacherDTO hod;
}
