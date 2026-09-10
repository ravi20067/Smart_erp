package com.Smart.Erp.Service;

import com.Smart.Erp.DTO.UserProfileDto;
import com.Smart.Erp.Entity.*;
import com.Smart.Erp.Repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.UUID;


@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepo userRepo;
    private final MappingService mappingService;
    private final CommonService commonService;

    public @Nullable UserProfileDto getProfile(String username) {
        User user = commonService.getUser(username);
        return mappingService.mapToResponse(user.getBasicDetail());
    }

    public UUID getPhoto(Long userId, String username) {
        return null;
    }
}
