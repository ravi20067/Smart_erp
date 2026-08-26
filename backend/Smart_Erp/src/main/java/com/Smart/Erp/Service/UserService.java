package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.UserProfileDto;
import com.Smart.Erp.Entity.*;
import com.Smart.Erp.Enum.Role;
import com.Smart.Erp.Repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepo userRepo;


    public User getUser(String username) {
        return userRepo.findByUsername(username).orElseThrow();
    }

    public @Nullable UserProfileDto getProfile(String username) {
        return null;
    }
}
