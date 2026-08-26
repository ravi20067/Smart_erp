package com.Smart.Erp.DTO.CommonAcademic;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class CommonCourseDTO {
    private Long id;

    private String courseName;

    private String courseCode;
}
