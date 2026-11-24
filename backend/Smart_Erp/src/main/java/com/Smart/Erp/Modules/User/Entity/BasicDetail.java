package com.Smart.Erp.Modules.User.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import com.Smart.Erp.Modules.User.DTO.BasicDetail.UserProfileResponse;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;

@Entity
@Table(name = "basic_details")
@Getter
@Builder
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BasicDetail extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photo_id", unique = true)
    private FileMetadata photo;

    private LocalDate dob;
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
    private String fatherName;
    private String motherName;
    private String guardianMobileNumber;
    private String address;

    public @Nullable UserProfileResponse mapToResponse() {
        return UserProfileResponse.builder()
                .userId(this.getUser().getId())
                .username(this.getUser().getUsername())
                .firstName(this.getFirstName())
                .lastName(this.getLastName())
                .enabled(this.getUser().getEnabled())
                .dob(this.getDob())
                .email(this.getEmail())
                .phone(this.getPhone())
                .fatherName(this.getFatherName())
                .motherName(this.getMotherName())
                .address(this.getAddress())
                .guardianMobileNumber(this.getGuardianMobileNumber())
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .createdBy(this.getCreatedBy() != null ? this.getCreatedBy().toCommonDTO() : null)
                .updatedBy(this.getUpdatedBy() != null ? this.getUpdatedBy().toCommonDTO() : null)
                .build();
    }
}
