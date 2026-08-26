package com.Smart.Erp.Config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "admin")
public class AdminProperties {

    private String userName;
    private String password;
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
    private String fatherName;
    private String motherName;
    private String guardianMobileNumber;
    private String address;
}