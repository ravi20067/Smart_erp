package com.Smart.Erp.Modules.User.Services;

import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.File.Enum.FileType;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.User.DTO.UserProfileDto;
import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.UserRole;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@AllArgsConstructor
public class UserCommonService {
    //do not use TeacherCommonService here because it will create circular dependency

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final FileService fileService;

    public User getUser(Long userId) {
        return userRepo.findById(userId).orElseThrow(
                () ->
                        new ResourceNotFoundException("User not found with this id : " + userId)
        );
    }

    public User getUser(String username) {
        return userRepo.findByUsername(username).orElseThrow();
    }

    public void updateRole(User user, UserRole userRole) {
        user.setUserRoleUser(userRole);
        user.setUsername(user.getUsername().replace(user.getUserRoleUser().getCode(), userRole.getCode()));
        userRepo.save(user);
    }

    public User createUser(UserProfileDto detail, String userName, MultipartFile file, UserRole userRole, String password) {
        FileMetadata metadata = null;

        if (!file.isEmpty()) {
            metadata = fileService.upload(file, FileType.PHOTO);
        }
        User user = User.builder()
                .username(userName)
                .userRoleUser(userRole)
                .password(passwordEncoder.encode(password))
                .build();

        BasicDetail basicDetail = null;
        if (detail != null) {
            basicDetail = BasicDetail.builder()
                    .photo(metadata)
                    .user(user)
                    .dob(detail.getDob())
                    .firstName(detail.getFirstName())
                    .lastName(detail.getLastName())
                    .phone(detail.getPhone())
                    .email(detail.getEmail())
                    .fatherName(detail.getFatherName())
                    .motherName(detail.getMotherName())
                    .guardianMobileNumber(detail.getGuardianMobileNumber())
                    .address(detail.getAddress())
                    .build();
        }

        user.setBasicDetail(basicDetail);

        return userRepo.save(user);
    }
}
