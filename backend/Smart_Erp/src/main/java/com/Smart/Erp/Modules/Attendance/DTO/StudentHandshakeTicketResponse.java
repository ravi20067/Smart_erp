package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentHandshakeTicketResponse {
    private String ticketId;
    private String sessionUuid;
    private Long studentId;
    private String studentRef;
    private String studentEd25519PublicKey;
    private String studentX25519PublicKey;
    private String studentNonce;
    private long issuedAt;
    private long expiresAt;
    private String backendPublicKey;
    private String backendTicketSignature;
}
