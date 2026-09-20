package com.Smart.Erp.Modules.User.Services;

import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.File.Enum.FileType;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileRequest;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Repo.BasicDetailRepo;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.format.DateTimeFormatter;


@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepo userRepo;
    private final BasicDetailRepo basicDetailRepo;
    private final PasswordEncoder passwordEncoder;

    private final UserCommonService userCommonService;

    private final FileService fileService;

    public @Nullable UserProfileResponse getProfile(String username) {
        User user = userCommonService.getUser(username);
        return user.getBasicDetail().mapToResponse();
    }

    public FileMetadata getPhoto(Long userId, String username) {
        User serviceUser = userCommonService.getUser(username);
        UserRoles serviceUserRole = serviceUser.getUserRole();

        if (userId != null) {
            User user = userCommonService.getUser(userId);
            if (
                    UserRoles.isSuperAdmin(serviceUserRole) ||
                            (user.getUniversity() == serviceUser.getUniversity() &&
                                    (
                                            UserRoles.isSchoolUser(serviceUserRole) ||
                                                    (
                                                            user.getUserRole() == UserRoles.STUDENT &&
                                                                    UserRoles.isSectionUser(serviceUserRole)
                                                    )
                                    )
                            )
            ) {
                return user.getBasicDetail().getPhoto();
            } else {
                throw new IllegalArgumentException("Unauthorized to access the requested user's photo");
            }
        }
        return serviceUser.getBasicDetail().getPhoto();
    }

    public UserProfileResponse update(String username, UserProfileRequest request, MultipartFile file, Long userid) {

        User serviceUser = userCommonService.getUser(username);

        UserRoles serviceUserRole = serviceUser.getUserRole();

        User user ;
        BasicDetail basicDetail ;

        if (userid != null  && UserRoles.isUniversityUser(serviceUserRole)) {
            user = userCommonService.getUser(userid);
            basicDetail = user.getBasicDetail();
            if (file != null && !file.isEmpty()) {
                if (basicDetail.getPhoto() != null) {
                    fileService.deleteFile(basicDetail.getPhoto());
                }
                FileMetadata metadata = fileService.upload(file, FileType.PHOTO);
                basicDetail.setPhoto(metadata);
            }
        } else {
            user = serviceUser;
            basicDetail = user.getBasicDetail();
        }

        basicDetail.setFirstName(request.getFirstName());
        basicDetail.setLastName(request.getLastName());
        basicDetail.setDob(request.getDob());
        basicDetail.setEmail(request.getEmail());
        basicDetail.setPhone(request.getPhone());
        basicDetail.setFatherName(request.getFatherName());
        basicDetail.setMotherName(request.getMotherName());
        basicDetail.setGuardianMobileNumber(request.getGuardianMobileNumber());
        basicDetail.setAddress(request.getAddress());

        return basicDetailRepo.save(basicDetail).mapToResponse();
    }

    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = userCommonService.getUser(username);

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
    }

    public void resetPassword(String username, String userId) {
        User serviceUser = userCommonService.getUser(username);
        UserRoles serviceUserRole = serviceUser.getUserRole();

        User userToReset = userCommonService.getUser(userId);

        if (
                UserRoles.isSuperAdmin(serviceUserRole) ||
                        (
                                serviceUser.getUniversity() == userToReset.getUniversity() &&
                                        UserRoles.isUniversityUser(serviceUserRole)
                        )
        ) {
            throw new IllegalArgumentException("Unauthorized to reset the requested user's password");
        }

        String newPassword = userToReset.getBasicDetail().getDob() != null ? userToReset.getBasicDetail().getDob().format(DateTimeFormatter.ISO_LOCAL_DATE) : "";
        userToReset.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(userToReset);
    }

    public void changeEnable(Boolean enable, String userName, String userId) {
        User serviceUser = userCommonService.getUser(userName);
        UserRoles serviceUserRole = serviceUser.getUserRole();

        User userToDisable = userCommonService.getUser(userId);

        if (
                UserRoles.isSuperAdmin(serviceUserRole) ||
                        (
                                serviceUser.getUniversity() == userToDisable.getUniversity() &&
                                        UserRoles.isUniversityUser(serviceUserRole)
                        )
        ) {
            userToDisable.setEnabled(enable);
            userRepo.save(userToDisable);
        }

        throw new IllegalArgumentException("Unauthorized to disable the requested user");
    }
}
