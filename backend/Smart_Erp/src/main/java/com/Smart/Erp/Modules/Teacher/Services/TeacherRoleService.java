package com.Smart.Erp.Modules.Teacher.Services;

import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.Teacher.DTO.Role.RoleFilter;
import com.Smart.Erp.Modules.Teacher.DTO.Role.UserRoleResponse;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import com.Smart.Erp.Modules.Teacher.Repo.TeacherRepo;
import com.Smart.Erp.Modules.User.Entity.Role;
import com.Smart.Erp.Modules.User.Entity.UserRole;
import com.Smart.Erp.Modules.User.Enum.PermissionAction;
import com.Smart.Erp.Modules.User.Enum.ResourceType;
import com.Smart.Erp.Modules.User.Repo.UserRoleRepo;
import com.Smart.Erp.Modules.User.Services.RoleCommonService;
import com.Smart.Erp.Modules.User.Services.UserCommonService;
import com.Smart.Erp.Security.AuthorizationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class TeacherRoleService {

    private final AuthorizationService authorizationService;
    private final TeacherRepo teacherRepo;
    private final RoleCommonService roleCommonService;
    private final TeacherCommonService teacherCommonService;
    private final UserRoleRepo userRoleRepo;
    private final UserCommonService userCommonService;


    public List<UserRoleResponse> getTeacherRoles(Long teacherId) {
        if (teacherId != null) {
            Teacher teacher = teacherCommonService.getTeacher(teacherId);
            return List.of(teacher.mapToUserRoleResponse(authorizationService.getPermissionAction(ResourceType.TEACHER, teacher.getId())));
        }
        Map<Long, List<PermissionAction>> map = authorizationService.getAll(ResourceType.TEACHER);
        List<Teacher> teachers = teacherRepo.findAllById(map.keySet());

        return teachers.stream()
                .map(
                        teacher ->
                                teacher.mapToUserRoleResponse(authorizationService.getPermissionAction(ResourceType.TEACHER, teacher.getId()))
                )
                .toList();
    }

    public UserRoleResponse updateTeacherRole(Long teacherId, Long roleId) {
        Teacher teacher = teacherCommonService.getTeacher(teacherId);
        Role role = roleCommonService.getRole(roleId);

        if (!checkRoleBelongsToSameUniversity(teacher.getUser().getUniversity(), role)) {
            throw new IllegalArgumentException("Role does not belong to the same university as the teacher.");
        }

        UserRole userRole = UserRole.builder()
                .user(teacher.getUser())
                .role(role)
                .active(true)
                .build();
        userRoleRepo.save(userRole);

        userCommonService.adjustRoleChange(userRole.getUser(), role);

        return teacher.mapToUserRoleResponse(authorizationService.getPermissionAction(ResourceType.TEACHER, teacher.getId()));
    }

    public UserRoleResponse changeActiveStatus(Long teacherId, Long userRoleId, Boolean status) {
        Teacher teacher = teacherCommonService.getTeacher(teacherId);
        UserRole userRole = roleCommonService.getUserRole(userRoleId);

        if (!userRole.getUser().equals(teacher.getUser())) {
            throw new IllegalArgumentException("UserRole does not belong to the specified teacher.");
        }

        userRole.setActive(status);
        userRoleRepo.save(userRole);

        userCommonService.adjustRoleChange(teacher.getUser());

        return teacher.mapToUserRoleResponse(authorizationService.getPermissionAction(ResourceType.TEACHER, teacher.getId()));
    }

    public List<RoleFilter> getRoleFilter(Long teacherId) {
        Teacher teacher = teacherCommonService.getTeacher(teacherId);
        List<Role> roles = roleCommonService.getRolesByUniversity(teacher.getUser().getUniversity());

        return roles.stream()
                .filter(role ->
                        checkRoleBelongsToSameUniversity(teacher.getUser().getUniversity(), role) && role.getActive()
                )
                .map(role -> RoleFilter.builder()
                        .id(role.getId())
                        .name(role.getName())
                        .description(role.getDescription())
                        .enumValue(role.getUserRole())
                        .build()
                )
                .toList();
    }

    private boolean checkRoleBelongsToSameUniversity(University university, Role role) {
        return university == role.getUniversity();
    }
}
