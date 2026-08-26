package com.Smart.Erp.DTO.Admin.Courses;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class CourseResponse {
    private Long id;
    private String courseName;
    private String courseCode;

}
