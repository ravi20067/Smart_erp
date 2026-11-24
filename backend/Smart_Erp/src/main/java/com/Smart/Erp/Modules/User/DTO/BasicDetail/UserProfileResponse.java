package com.Smart.Erp.Modules.User.DTO.BasicDetail;

import com.Smart.Erp.Core.Common.BaseDTO;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Getter
@SuperBuilder
public class UserProfileResponse extends BaseDTO {
    private Long userId;
    private Boolean enabled;
    private String username;
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
