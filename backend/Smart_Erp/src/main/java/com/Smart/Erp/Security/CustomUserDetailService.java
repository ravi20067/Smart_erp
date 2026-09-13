package com.Smart.Erp.Security;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class CustomUserDetailService implements UserDetailsService {
    @Autowired
    private UserRepo userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<User> user = userRepository.findByUsername(username);
        String password = user.get().getPassword();
        if (!user.get().getEnabled()){
            throw new UsernameNotFoundException("User not found username : "+ username);
        }
        if (password == null) {
            password = "{noop}oauth2user";
        }
        if(user.isPresent()){
            return org.springframework.security.core.userdetails.User.builder()
                    .username(user.get().getUsername())
                    .password(password)
                    .roles(String.valueOf(user.get().getUserRoleUser()))
                    .build();
        }
        throw new UsernameNotFoundException("User not found username : "+ username);
    }
}
