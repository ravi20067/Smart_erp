package com.Smart.Erp.Modules.User.Services;

import com.Smart.Erp.Modules.User.DTO.UserProfileDto;
import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.User.Entity.User;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class UserMappingService {
    //not add academic mapping service here because it will create circular dependency

    public String getNameUser(User user) {
        return user.getBasicDetail().getFirstName() + " " + user.getBasicDetail().getLastName();
    }

    public @Nullable UserProfileDto mapToResponse(BasicDetail basicDetail) {
        if (basicDetail == null) {
            return new UserProfileDto();
        }
        return UserProfileDto.builder()
                .id(basicDetail.getUser().getId())
                .username(basicDetail.getUser().getUsername())
                .firstName(basicDetail.getFirstName())
                .lastName(basicDetail.getLastName())
                .phone(basicDetail.getPhone())
                .email(basicDetail.getEmail())
                .fatherName(basicDetail.getFatherName())
                .motherName(basicDetail.getMotherName())
                .address(basicDetail.getAddress())
                .guardianMobileNumber(basicDetail.getGuardianMobileNumber())
                .build();
    }
}
