package com.Smart.Erp.Modules.Academic.DTO.Courses;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class CourseResponse {
    private Long id;
    private String name;
    private String code;
    private List<CommonDTO> subjects;
    private ActiveStatus activeStatus;
    private List<CommonDTO> sections;
    private List<CommonDTO> specializations;
    private CommonDTO programCoordinator;
    private CommonDTO department;
    private CommonDTO school;
    private CommonDTO academicYear;
    private Boolean NewEnrollmentAllowed;
}
