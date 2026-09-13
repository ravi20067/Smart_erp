package com.Smart.Erp.Modules.Academic.DTO.Courses;

import com.Smart.Erp.Core.Common.CommonDTO;
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
    private List<CommonDTO> sections;
    private List<CommonDTO> specializations;
    private CommonDTO programCoordinator;
}
