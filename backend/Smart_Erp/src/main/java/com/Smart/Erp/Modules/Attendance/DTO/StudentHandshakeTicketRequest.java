package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentHandshakeTicketRequest {
    private String sessionUuid;
    private String studentEd25519PublicKey;
    private String studentX25519PublicKey;
    private String studentNonce;
}
