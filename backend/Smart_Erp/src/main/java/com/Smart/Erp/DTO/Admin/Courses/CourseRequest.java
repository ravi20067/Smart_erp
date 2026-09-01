package com.Smart.Erp.DTO.Admin.Courses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class CourseRequest {
    private Long id;
    private String name;
    private String code;
    private Long programCoordinatorId;
}
