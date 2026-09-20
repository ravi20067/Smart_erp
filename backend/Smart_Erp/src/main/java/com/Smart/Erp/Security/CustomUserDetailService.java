package com.Smart.Erp.Security;

import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class CustomUserDetailService implements UserDetailsService {

    @Autowired
    private UserRepo userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier)
            throws UsernameNotFoundException {

        User user = userRepository.findByLoginIdentifier(identifier)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found username : " + identifier
                        )
                );

        String password = user.getPassword();

        if (password == null) {
            password = "{noop}oauth2user";
        }

        // 1. Safely extract the university ID (assuming your User entity has getUniversity())
        Long universityId = null;
        if (user.getUniversity() != null) {
            universityId = user.getUniversity().getId();
        }

        // 2. Map the role to Spring Security's GrantedAuthority
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(user.getUserRole().name());

        // 3. Return our new CustomUserDetails
        return new CustomUserDetails(
                user.getUsername(),
                password,
                user.getEnabled(),
                true, // accountNonExpired
                true, // credentialsNonExpired
                true, // accountNonLocked
                Collections.singletonList(authority),
                universityId // <-- Pass the universityId here
        );
    }
}