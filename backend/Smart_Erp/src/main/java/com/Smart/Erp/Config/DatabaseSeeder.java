package com.Smart.Erp.Config;

import com.Smart.Erp.Modules.User.Entity.BasicDetail;
import com.Smart.Erp.Modules.Academic.Entity.University;
import com.Smart.Erp.Modules.User.Entity.User;
import com.Smart.Erp.Modules.User.Enum.UserRoles;
import com.Smart.Erp.Modules.Academic.Repo.UniversityRepo;
import com.Smart.Erp.Modules.User.Repo.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepo userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminProperties admin;
    private final UniversityRepo universityRepo;

    @Transactional
    @Override
    public void run(String... args) {

        if (userRepository.count() == 0) {

            University university = University.builder()
                    .name(admin.getFirstName())
                    .build();

            university = universityRepo.save(university);

            String password = passwordEncoder.encode(admin.getPassword());

            List<User> admins = new ArrayList<>();

            for (UserRoles userRole : UserRoles.values()) {

                String userName = admin.getUserName();

                if (userRole != UserRoles.ADMIN) {
                    userName = userName + userRole.name().toLowerCase() ;
                }

                User user = User.builder()
                        .username(userName)
                        .password(password)
                        .enabled(true)
                        .userRole(userRole)
                        .university(university)
                        .build();

                BasicDetail basicDetail = BasicDetail.builder()
                        .firstName(admin.getFirstName())
                        .lastName(admin.getLastName())
                        .phone(admin.getPhone())
                        .email(admin.getEmail())
                        .fatherName(admin.getFatherName())
                        .motherName(admin.getMotherName())
                        .guardianMobileNumber(admin.getGuardianMobileNumber())
                        .address(admin.getAddress())
                        .user(user)                 
                        .build();

                user.setBasicDetail(basicDetail);

                admins.add(user);
            }

            userRepository.saveAll(admins);
        }
    }
}
