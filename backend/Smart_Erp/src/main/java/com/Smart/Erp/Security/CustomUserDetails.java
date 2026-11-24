package com.Smart.Erp.Security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

public class CustomUserDetails extends User {

    private final Long universityId;
    private final Long userId;

    public CustomUserDetails(String username, String password, boolean enabled,
                             boolean accountNonExpired, boolean credentialsNonExpired,
                             boolean accountNonLocked,
                             Collection<? extends GrantedAuthority> authorities,
                             Long universityId,
                             Long userId) {

        // Pass the standard fields up to Spring Security
        super(username, password, enabled, accountNonExpired, credentialsNonExpired, accountNonLocked, authorities);

        // Store our custom field
        this.universityId = universityId;
        this.userId = userId;
    }

    public Long getUniversityId() {
        return universityId;
    }

    public Long getUserId() {
        return userId;
    }
}