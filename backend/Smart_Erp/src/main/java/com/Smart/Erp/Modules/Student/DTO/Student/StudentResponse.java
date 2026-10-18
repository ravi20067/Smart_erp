package com.Smart.Erp.Modules.Student.DTO.Student;

import com.Smart.Erp.Modules.Student.DTO.Enrollment.StudentEnrollmentResponse;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StudentResponse {
    private Long id;
    private String registrationNumber;
    private UserProfileResponse basicDetailRequest;
}
