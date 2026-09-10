package com.Smart.Erp.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "devices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Devices {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String deviceEPid;

    private String location;

    private String password;

    private Boolean status;

    @ToString.Exclude
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}
