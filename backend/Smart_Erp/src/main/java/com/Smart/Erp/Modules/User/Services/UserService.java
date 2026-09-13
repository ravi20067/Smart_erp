package com.Smart.Erp.Modules.User.Services;

import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.File.Enum.FileType;
import com.Smart.Erp.Modules.User.DTO.UserProfileDto;
import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.User.Enum.UserRole;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;


@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    private final UserCommonService userCommonService;
    private final UserMappingService mappingService;

    private final FileService fileService;

    public @Nullable UserProfileDto getProfile(String username) {
        User user = userCommonService.getUser(username);
        return mappingService.mapToResponse(user.getBasicDetail());
    }

    public UUID getPhoto(Long userId, String username) {
        return null;
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
