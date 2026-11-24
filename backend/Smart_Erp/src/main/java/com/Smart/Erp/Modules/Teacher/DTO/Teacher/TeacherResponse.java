package com.Smart.Erp.Modules.Teacher.DTO.Teacher;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Getter
@SuperBuilder
public class TeacherResponse extends BaseDTO {
    private Long id;
    private UserProfileResponse basicDetailRequest;
    private List<CommonDTO> subjects;
    private CommonDTO university;
    private List<PermissionAction> permissionActions;
}
