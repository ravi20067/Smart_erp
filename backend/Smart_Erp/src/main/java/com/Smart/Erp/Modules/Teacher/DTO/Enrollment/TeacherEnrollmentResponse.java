package com.Smart.Erp.Modules.Teacher.DTO.Enrollment;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.User.Enum.EnrollmentStatus;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Getter
@Builder
public class TeacherEnrollmentResponse {

    private CommonDTO teacher;
    private List<EnrollmentResponse> enrollmentResponses;
    private CommonDTO university;

    @Getter
    @SuperBuilder
    public static class EnrollmentResponse extends BaseDTO {
        private Long id;
        private EnrollmentStatus status;
        private List<CommonDTO> subjects;
        private List<PermissionAction> permissionActions;
    }
}
