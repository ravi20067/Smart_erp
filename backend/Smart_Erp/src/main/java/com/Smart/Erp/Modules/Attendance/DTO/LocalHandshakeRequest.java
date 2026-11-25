package com.Smart.Erp.Modules.Attendance.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocalHandshakeRequest {
    private String sessionUuid;
    private Long teacherId;
    private String studentRef;
    private String ticketId;
    private String nonce;
    private String teacherNonce;
    private String studentNonce;
    private long timestamp;
    private long expiresAt;
    private long studentProofTimestamp;
    private long receiptIssuedAt;
    private long receiptExpiresAt;
    private String qrSignature;
    private String clientIp;
    private String companionReceiptId;
    private String teacherEd25519PublicKey;
    private String teacherX25519PublicKey;
    private String studentEd25519PublicKey;
    private String studentX25519PublicKey;
    private String teacherReceiptSignature;
    private String studentProofSignature;
    private String receiptHmac;
}
