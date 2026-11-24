package com.Smart.Erp.Modules.SecurityGuard.DTO;

import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SecurityGuardRequest {
    private String badgeNumber;
    private String assignedGate;
    private String shift;
    private String emergencyContact;
    private LocalDate joiningDate;
    private Boolean status;
    private UserProfileRequest basicDetailRequest;
}
