package com.Smart.Erp.Modules.Academic.DTO.Specialization;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.Academic.Enum.ActiveStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.util.List;

@SuperBuilder
@Getter
public class SpecializationResponse extends BaseDTO {
    private Long id;

    private String name;

    private String code;

    private List<CommonDTO> subjects;

    private List<CommonDTO> sectionGroups;

    private CommonDTO course;

    private CommonDTO department;

    private CommonDTO school;

    private CommonDTO university;

    private ActiveStatus activeStatus ;

    private List<PermissionAction> permissionActions;
}
