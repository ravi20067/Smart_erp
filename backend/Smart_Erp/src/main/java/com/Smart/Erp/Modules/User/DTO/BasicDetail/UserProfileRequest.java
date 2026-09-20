package com.Smart.Erp.Modules.User.DTO.BasicDetail;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileRequest {
    private String firstName;
    private String lastName;
    private LocalDate dob;
    private String email;
    private String phone;
    private String fatherName;
    private String motherName;
    private String guardianMobileNumber;
    private String address;
}
