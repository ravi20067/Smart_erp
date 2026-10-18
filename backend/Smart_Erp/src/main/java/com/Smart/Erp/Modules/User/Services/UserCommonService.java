package com.Smart.Erp.Modules.User.Services;

import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.File.Enum.FileType;
import com.Smart.Erp.Modules.File.Services.FileService;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileRequest;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.User.Entity.Role;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Entity.UserRole;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Repo.RoleRepo;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import com.Smart.Erp.Security.AuthorizationService;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UserCommonService {

    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final FileService fileService;
    private final AuthorizationService authorizationService;

    public User getUser(Long userId) {
        return userRepo.findById(userId).orElseThrow(
                () ->
                        new ResourceNotFoundException("User not found with this id : " + userId)
        );
    }

    public User getUser(String username) {
        return userRepo.findByUsername(username).orElseThrow();
    }

    public void updateRole(User user, UserRoles userRole) {
        user.setUserRole(userRole);
        user.setUsername(user.getUsername().replace(user.getUserRole().getCode(), userRole.getCode()));
        userRepo.save(user);
    }

    public User createUser(UserProfileRequest detail, String userName, MultipartFile file, UserRoles userRole, String password, University university) {
        FileMetadata metadata = null;

        if (!file.isEmpty()) {
            metadata = fileService.upload(file, FileType.PHOTO);
        }
        User user = User.builder()
                .username(userName)
                .userRole(userRole)
                .password(passwordEncoder.encode(password))
                .university(university)
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

        User savedUser = userRepo.save(user);

        authorizationService.createPermission(savedUser.getId(), ResourceType.USER,university.getId(), ResourceType.UNIVERSITY);

        return userRepo.save(user);
    }

    public void changeEnable(User userToDisable, Boolean enable) {
        userToDisable.setEnabled(enable);
        userRepo.save(userToDisable);
    }

    public void saveAll(List<User> users) {
        userRepo.saveAll(users);
    }

    public Role getRole(Long roleId) {
        return roleRepo.findById(roleId).orElseThrow(
                () ->
                        new ResourceNotFoundException("Role not found with this id : " + roleId)
        );
    }

    public void handleRoleUserRoleEnumChange(Role role) {
        List<User> users = role.getUsers().stream()
                .map(UserRole::getUser)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        users.forEach(user ->
            user.setUserRole(role.getUserRole())
        );

        saveAll(users);
    }

    public UserProfileResponse update(User user, UserProfileRequest request, MultipartFile file) {

        BasicDetail basicDetail = user.getBasicDetail();

        if (file != null && !file.isEmpty()) {
            if (basicDetail.getPhoto() != null) {
                fileService.deleteFile(basicDetail.getPhoto());
            }
            FileMetadata metadata = fileService.upload(file, FileType.PHOTO);
            basicDetail.setPhoto(metadata);
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

        return userRepo.save(user).getBasicDetail().mapToResponse();
    }

    public void resetPassword(User user) {
        LocalDate dob = user.getBasicDetail().getDob();
        String formattedDob = dob != null ? dob.format(DateTimeFormatter.ISO_LOCAL_DATE) : "";
        user.setPassword(passwordEncoder.encode(formattedDob));
        userRepo.save(user);
    }
}
