package com.Smart.Erp.Security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component("securityVerifier")
public class SecurityVerifier {

    /**
     * Verifies if the current user has access to the target university data.
     * SUPER_ADMIN bypasses this check.
     */
    public boolean hasAccessToUniversity(Long targetUniversityId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        // 1. Check if the user is a SUPER_ADMIN (Bypass University Check)
        boolean isSuperAdmin = authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority ->
                        grantedAuthority.getAuthority().equals("ROLE_SUPERADMIN") ||
                                grantedAuthority.getAuthority().equals("SUPERADMIN"));

        if (isSuperAdmin) {
            return true;
        }

        // 2. Guard clause: If no university ID is provided, deny access for regular admins
        if (targetUniversityId == null) {
            return false;
        }

        // 3. Safely check and cast the principal to avoid ClassCastException
        if (!(authentication.getPrincipal() instanceof CustomUserDetails)) {
            return false;
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userUniversityId = userDetails.getUniversityId();

        // 4. Verify they match
        return userUniversityId != null && userUniversityId.equals(targetUniversityId);
    }

}