package com.Smart.Erp.Modules.SecurityGuard.Services;

import com.Smart.Erp.Core.Common.CommonDTO;
import com.Smart.Erp.Core.Exception.OperationNotAllowedException;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.Academic.Services.AcademicCommonService;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.SecurityGuard.DTO.SecurityGuardRequest;
import com.Smart.Erp.Modules.SecurityGuard.DTO.SecurityGuardResponse;
import com.Smart.Erp.Modules.SecurityGuard.Entity.SecurityGuard;
import com.Smart.Erp.Modules.SecurityGuard.Repo.SecurityGuardRepo;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileRequest;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class SecurityGuardService {

    private final AuthorizationService authorizationService;
    private final SecurityGuardRepo securityGuardRepo;
    private final SecurityGuardCommonService securityGuardCommonService;
    private final AcademicCommonService academicCommonService;
    private final UserCommonService userCommonService;

    public List<SecurityGuardResponse> get() {
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.SECURITY_GUARD);

        if (map == null || map.isEmpty()) {
            User current = authorizationService.getCurrentUser();
            if (current != null && current.getUserRole() == UserRoles.SUPER_ADMIN) {
                List<SecurityGuard> allGuards = securityGuardRepo.findAll();
                return allGuards.stream()
                        .map(guard -> guard.mapToResponse(List.of(
                                PermissionAction.CREATE_CHILD,
                                PermissionAction.READ,
                                PermissionAction.UPDATE,
                                PermissionAction.DELETE
                        )))
                        .toList();
            }
            return Collections.emptyList();
        }

        List<SecurityGuard> guards = securityGuardRepo.findAllById(map.keySet());
        return guards.stream()
                .map(guard -> guard.mapToResponse(map.get(guard.getId())))
                .toList();
    }

    public FileMetadata getPhoto(Long userId) {
        return userCommonService.getUser(userId).getBasicDetail().getPhoto();
    }

    public SecurityGuardResponse create(Long universityID, SecurityGuardRequest request, MultipartFile file) {
        if (request == null || request.getBasicDetailRequest() == null) {
            throw new IllegalArgumentException("Guard basic details are required.");
        }

        LocalDate dob = request.getBasicDetailRequest().getDob();
        String formattedDob = dob != null ? dob.format(DateTimeFormatter.ISO_LOCAL_DATE) : "";
        University university = academicCommonService.getUniversity(universityID);

        String username = userCommonService.getAvailableUsername(
                UserRoles.SECURITY_GUARD.getCode(),
                university.getUsers().size() + 1
        );

        User user = userCommonService.createUser(
                request.getBasicDetailRequest(),
                username,
                file,
                UserRoles.SECURITY_GUARD,
                formattedDob.isEmpty() ? "Guard@123" : formattedDob,
                university
        );

        String badge = request.getBadgeNumber();
        if (badge == null || badge.isBlank()) {
            badge = "SG-" + username;
        } else if (securityGuardRepo.existsByBadgeNumber(badge.trim())) {
            throw new OperationNotAllowedException("Badge number '" + badge.trim() + "' is already assigned to another guard.");
        }

        SecurityGuard guard = SecurityGuard.builder()
                .user(user)
                .badgeNumber(badge.trim())
                .assignedGate(request.getAssignedGate() != null && !request.getAssignedGate().isBlank() ? request.getAssignedGate().trim() : "Main Gate")
                .shift(request.getShift() != null && !request.getShift().isBlank() ? request.getShift().trim() : "DAY")
                .emergencyContact(request.getEmergencyContact() != null ? request.getEmergencyContact().trim() : null)
                .joiningDate(request.getJoiningDate() != null ? request.getJoiningDate() : LocalDate.now())
                .build();

        guard = securityGuardRepo.save(guard);

        authorizationService.createPermission(
                guard.getId(),
                ResourceType.SECURITY_GUARD,
                universityID,
                ResourceType.UNIVERSITY
        );

        return guard.mapToResponse(
                authorizationService.getPermissionAction(ResourceType.SECURITY_GUARD, guard.getId())
        );
    }

    public UserProfileResponse updateProfile(Long guardId, UserProfileRequest request, MultipartFile file) {
        SecurityGuard guard = securityGuardCommonService.getSecurityGuard(guardId);
        return userCommonService.update(guard.getUser(), request, file);
    }

    public SecurityGuardResponse updateGuardDetails(Long guardId, SecurityGuardRequest request) {
        SecurityGuard guard = securityGuardCommonService.getSecurityGuard(guardId);

        if (request.getBadgeNumber() != null && !request.getBadgeNumber().isBlank()) {
            String badge = request.getBadgeNumber().trim();
            if (!badge.equalsIgnoreCase(guard.getBadgeNumber()) && securityGuardRepo.existsByBadgeNumber(badge)) {
                throw new OperationNotAllowedException("Badge number '" + badge + "' is already taken.");
            }
            guard.setBadgeNumber(badge);
        }

        if (request.getAssignedGate() != null) {
            guard.setAssignedGate(request.getAssignedGate().trim());
        }
        if (request.getShift() != null && !request.getShift().isBlank()) {
            guard.setShift(request.getShift().trim());
        }
        if (request.getEmergencyContact() != null) {
            guard.setEmergencyContact(request.getEmergencyContact().trim());
        }
        if (request.getJoiningDate() != null) {
            guard.setJoiningDate(request.getJoiningDate());
        }

        guard = securityGuardRepo.save(guard);
        return guard.mapToResponse(
                authorizationService.getPermissionAction(ResourceType.SECURITY_GUARD, guard.getId())
        );
    }

    public void changeEnable(Long guardId, Boolean enable) {
        SecurityGuard guard = securityGuardCommonService.getSecurityGuard(guardId);
        userCommonService.changeEnable(guard.getUser(), enable);
    }

    public void resetPassword(Long guardId) {
        SecurityGuard guard = securityGuardCommonService.getSecurityGuard(guardId);
        userCommonService.resetPassword(guard.getUser());
    }

    public void delete(Long guardId) {
        SecurityGuard guard = securityGuardCommonService.getSecurityGuard(guardId);
        User user = guard.getUser();
        securityGuardRepo.delete(guard);
        if (user != null) {
            userCommonService.changeEnable(user, false);
        }
    }

    public List<CommonDTO> filterUniversity() {
        return academicCommonService.getUniversityFilter();
    }
}
