package com.Smart.Erp.Modules.SecurityGuard.DTO;

import com.Smart.Erp.Core.Common.BaseDTO;
import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.List;

@Getter
@SuperBuilder
public class SecurityGuardResponse extends BaseDTO {
    private Long id;
    private String badgeNumber;
    private String assignedGate;
    private String shift;
    private String emergencyContact;
    private LocalDate joiningDate;
    private UserProfileResponse basicDetailRequest;
    private CommonDTO university;
    private List<PermissionAction> permissionActions;
}
