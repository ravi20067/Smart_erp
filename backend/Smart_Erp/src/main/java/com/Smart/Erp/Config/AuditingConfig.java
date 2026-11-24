package com.Smart.Erp.Config;

import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Security.CustomUserDetails;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class AuditingConfig {

    @PersistenceContext
    private EntityManager entityManager;

    @Bean
    public AuditorAware<User> auditorAware() {

        return () -> {

            Authentication authentication =
                    SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null ||
                    !authentication.isAuthenticated()) {
                return Optional.empty();
            }

            if (!(authentication.getPrincipal() instanceof CustomUserDetails userDetails)
                    || userDetails.getUserId() == null) {
                return Optional.empty();
            }

            return Optional.of(entityManager.getReference(
                    User.class,
                    userDetails.getUserId()
            ));
        };
    }
}