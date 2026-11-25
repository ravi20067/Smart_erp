package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherQRPayload {
    private String sessionId;
    private Long teacherId;
    private String localServerIp;
    private Integer localServerPort;
    private String teacherEd25519PublicKey;
    private String teacherX25519PublicKey;
    private String allowedSubnets;
    private String backendPublicKey;
    private long timestamp;
    private long expiresAt;
    private String nonce;
    private String signature;
}
