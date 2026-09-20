package com.Smart.Erp.Modules.Academic.DTO.Sections;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SectionResponse {
    private String id;
    private String name;
    private String code;
    private Integer capacity;
    private List<SectionGroupResponse> sectionGroup;
    private CommonDTO mentor;
    private CommonDTO course;
    private CommonDTO department;
    private CommonDTO school;
    private ActiveStatus activeStatus ;
    private CommonDTO academicYear;
}
