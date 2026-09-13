package com.Smart.Erp.Modules.User.Entity;

import com.Smart.Erp.Config.BaseAuditableEntity;
import com.Smart.Erp.Modules.File.Entity.FileMetadata;
import jakarta.persistence.*;
import lombok.*;

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
}
