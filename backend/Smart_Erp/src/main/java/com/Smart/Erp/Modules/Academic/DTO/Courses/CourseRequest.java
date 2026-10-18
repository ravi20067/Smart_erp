package com.Smart.Erp.Modules.Academic.DTO.Courses;

import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
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

    private ActiveStatus activeStatus;
    private Boolean newEnrollmentAllowed;
}
