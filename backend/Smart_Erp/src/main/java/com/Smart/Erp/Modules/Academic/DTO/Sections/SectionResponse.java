package com.Smart.Erp.Modules.Academic.DTO.Sections;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SectionResponse {
    private Long id;
    private String name;
    private String code;
    private Integer capacity;
    private List<SectionGroupResponse> sectionGroup;
    private CommonDTO course;
    private CommonDTO academicYear;
    private CommonDTO department;
    private CommonDTO school;
    private CommonDTO university;
    private ActiveStatus activeStatus ;
    private List<PermissionAction> permissionActions;
}
