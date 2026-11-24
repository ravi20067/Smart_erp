package com.Smart.Erp.Modules.User.Services;

import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.User.Entity.Role;
import com.Smart.Erp.Modules.User.Entity.UserRole;
import com.Smart.Erp.Modules.User.Repo.RoleRepo;
import com.Smart.Erp.Modules.User.Repo.UserRoleRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleCommonService {
    private final RoleRepo roleRepo;
    private final UserRoleRepo userRoleRepo;

    public Role getRole(Long roleId) {
        return roleRepo.findById(roleId).orElseThrow(
                () -> new ResourceNotFoundException("Role not found with this id : " + roleId)
        );
    }

    public UserRole getUserRole(Long userRoleId) {
        return userRoleRepo.findById(userRoleId).orElseThrow(
                () -> new ResourceNotFoundException("UserRole not found with this id : " + userRoleId)
        );
    }

    public List<Role> getRolesByUniversity(University university) {
        return roleRepo.findByUniversity(university);
    }
}
