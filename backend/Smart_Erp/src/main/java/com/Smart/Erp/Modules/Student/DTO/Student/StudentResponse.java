package com.Smart.Erp.Modules.Student.DTO.Student;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Modules.Student.DTO.Enrollment.StudentEnrollmentResponse;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Getter
@SuperBuilder
public class StudentResponse extends BaseDTO {
    private Long id;
    private String registrationNumber;
    private UserProfileResponse basicDetailRequest;
    private Boolean hasEnrolledFace;
    private LocalDateTime faceEnrolledAt;
}
