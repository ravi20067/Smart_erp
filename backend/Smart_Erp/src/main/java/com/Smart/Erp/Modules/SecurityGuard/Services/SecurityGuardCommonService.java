package com.Smart.Erp.Modules.SecurityGuard.Services;

import com.Smart.Erp.Core.Exception.ResourceNotFoundException;
import com.Smart.Erp.Modules.SecurityGuard.Entity.SecurityGuard;
import com.Smart.Erp.Modules.SecurityGuard.Repo.SecurityGuardRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SecurityGuardCommonService {

    private final SecurityGuardRepo securityGuardRepo;

    public SecurityGuard getSecurityGuard(Long id) {
        return securityGuardRepo.findById(id).orElseThrow(
                () -> new ResourceNotFoundException("Security Guard not found with this id: " + id)
        );
    }

    public SecurityGuard getSecurityGuardByUserId(Long userId) {
        return securityGuardRepo.findByUserId(userId).orElseThrow(
                () -> new ResourceNotFoundException("Security Guard not found with user id: " + userId)
        );
    }
}
