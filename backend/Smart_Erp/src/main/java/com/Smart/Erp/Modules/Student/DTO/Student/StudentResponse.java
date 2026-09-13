package com.Smart.Erp.Modules.Student.DTO.Student;

import com.Smart.Erp.Modules.User.DTO.UserProfileDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StudentResponse {
    private Long id;
    private String registrationNumber;
    private UserProfileDto basicDetailRequest;
    private StudentEnrollmentResponse enrollment;
}
