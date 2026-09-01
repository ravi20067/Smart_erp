package com.Smart.Erp.DTO.Admin.Courses;

import com.Smart.Erp.DTO.Admin.Specialization.SpecializationResponse;
import com.Smart.Erp.DTO.CommonDTO;
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
