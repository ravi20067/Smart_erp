package com.Smart.Erp.Modules.Attendance.Services;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.KeyAgreement;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Objects;

/**
 * Provides vetted standard cryptographic primitives for local classroom handshakes:
 * - Ed25519 asymmetric digital signatures (backend attestation tickets, teacher companion receipts, student proofs)
 * - X25519 key agreement & validation
 * - RFC 5869 HKDF-SHA256 & HMAC-SHA256 constant-time verification
 * - CSPRNG nonce generation
 */
@Service
public class CryptographicHandshakeService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${app.attendance.handshake.backend-ed25519-private-key:}")
    private String configuredBackendPrivateKey;

    @Value("${app.attendance.handshake.backend-ed25519-public-key:}")
    private String configuredBackendPublicKey;

    private volatile KeyPair backendSigningKeyPair;

    @PostConstruct
    public void initKeys() {
        ensureBackendKeys();
    }

    private synchronized void ensureBackendKeys() {
        if (backendSigningKeyPair != null) {
            return;
        }
        try {
            if (configuredBackendPrivateKey != null && !configuredBackendPrivateKey.isBlank()
                    && configuredBackendPublicKey != null && !configuredBackendPublicKey.isBlank()) {
                KeyFactory kf = KeyFactory.getInstance("Ed25519");
                PrivateKey priv = kf.generatePrivate(new PKCS8EncodedKeySpec(decodeBase64Flexible(configuredBackendPrivateKey)));
                PublicKey pub = kf.generatePublic(new X509EncodedKeySpec(decodeBase64Flexible(configuredBackendPublicKey)));
                backendSigningKeyPair = new KeyPair(pub, priv);
                return;
            }
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("Ed25519");
            backendSigningKeyPair = kpg.generateKeyPair();
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize backend Ed25519 attestation keypair", e);
        }
    }

    public String getBackendEd25519PublicKeyBase64() {
        ensureBackendKeys();
        return Base64.getEncoder().encodeToString(backendSigningKeyPair.getPublic().getEncoded());
    }

    public String generateNonce(int byteLength) {
        byte[] bytes = new byte[byteLength];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public PublicKey decodeEd25519PublicKey(String spkiBase64) {
        if (spkiBase64 == null || spkiBase64.isBlank()) {
            throw new RuntimeException("Ed25519 public key is required");
        }
        try {
            byte[] der = decodeBase64Flexible(spkiBase64.trim());
            KeyFactory kf = KeyFactory.getInstance("Ed25519");
            return kf.generatePublic(new X509EncodedKeySpec(der));
        } catch (Exception e) {
            throw new RuntimeException("Invalid Ed25519 public key encoding: " + e.getMessage());
        }
    }

    public PublicKey decodeX25519PublicKey(String spkiBase64) {
        if (spkiBase64 == null || spkiBase64.isBlank()) {
            throw new RuntimeException("X25519 public key is required");
        }
        try {
            byte[] der = decodeBase64Flexible(spkiBase64.trim());
            KeyFactory kf = KeyFactory.getInstance("X25519");
            return kf.generatePublic(new X509EncodedKeySpec(der));
        } catch (Exception e) {
            throw new RuntimeException("Invalid X25519 public key encoding: " + e.getMessage());
        }
    }

    public void validateEd25519AndX25519Keys(String ed25519SpkiBase64, String x25519SpkiBase64, String ownerLabel) {
        try {
            decodeEd25519PublicKey(ed25519SpkiBase64);
            decodeX25519PublicKey(x25519SpkiBase64);
        } catch (RuntimeException e) {
            throw new RuntimeException("Invalid " + ownerLabel + " public key material: " + e.getMessage());
        }
    }

    public String signWithBackendKey(String canonicalMessage) {
        ensureBackendKeys();
        return signEd25519(backendSigningKeyPair.getPrivate(), canonicalMessage);
    }

    public String signEd25519(PrivateKey privateKey, String canonicalMessage) {
        try {
            Signature sig = Signature.getInstance("Ed25519");
            sig.initSign(privateKey);
            sig.update(canonicalMessage.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(sig.sign());
        } catch (Exception e) {
            throw new RuntimeException("Ed25519 signing failed", e);
        }
    }

    public boolean verifyEd25519Signature(String publicKeySpkiBase64, String canonicalMessage, String signatureBase64) {
        if (publicKeySpkiBase64 == null || canonicalMessage == null || signatureBase64 == null || signatureBase64.isBlank()) {
            return false;
        }
        try {
            PublicKey pub = decodeEd25519PublicKey(publicKeySpkiBase64);
            byte[] sigBytes = decodeBase64Flexible(signatureBase64.trim());
            Signature sig = Signature.getInstance("Ed25519");
            sig.initVerify(pub);
            sig.update(canonicalMessage.getBytes(StandardCharsets.UTF_8));
            return sig.verify(sigBytes);
        } catch (Exception e) {
            return false;
        }
    }

    public byte[] computeX25519SharedSecret(PrivateKey ownPrivate, PublicKey peerPublic) {
        try {
            KeyAgreement ka = KeyAgreement.getInstance("X25519");
            ka.init(ownPrivate);
            ka.doPhase(peerPublic, true);
            return ka.generateSecret();
        } catch (Exception e) {
            throw new RuntimeException("X25519 key agreement failed", e);
        }
    }

    /**
     * RFC 5869 HKDF-SHA256 Extract + Expand.
     */
    public byte[] hkdfSha256(byte[] ikm, byte[] salt, byte[] info, int outputLength) {
        try {
            byte[] effectiveSalt = (salt == null || salt.length == 0) ? new byte[32] : salt;
            Mac extractMac = Mac.getInstance("HmacSHA256");
            extractMac.init(new SecretKeySpec(effectiveSalt, "HmacSHA256"));
            byte[] prk = extractMac.doFinal(ikm);

            byte[] okm = new byte[outputLength];
            byte[] previousBlock = new byte[0];
            int offset = 0;
            byte counter = 1;
            Mac expandMac = Mac.getInstance("HmacSHA256");
            SecretKeySpec prkSpec = new SecretKeySpec(prk, "HmacSHA256");
            while (offset < outputLength) {
                expandMac.init(prkSpec);
                expandMac.update(previousBlock);
                if (info != null) {
                    expandMac.update(info);
                }
                expandMac.update(counter++);
                previousBlock = expandMac.doFinal();
                int toCopy = Math.min(previousBlock.length, outputLength - offset);
                System.arraycopy(previousBlock, 0, okm, offset, toCopy);
                offset += toCopy;
            }
            return okm;
        } catch (Exception e) {
            throw new RuntimeException("HKDF-SHA256 key derivation failed", e);
        }
    }

    public String computeHmacSha256Base64(byte[] key, String message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA256 calculation failed", e);
        }
    }

    public boolean verifyHmacSha256ConstantTime(byte[] key, String message, String expectedBase64) {
        if (key == null || message == null || expectedBase64 == null) {
            return false;
        }
        try {
            String computed = computeHmacSha256Base64(key, message);
            return MessageDigest.isEqual(
                    computed.getBytes(StandardCharsets.UTF_8),
                    expectedBase64.trim().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            return false;
        }
    }

    public byte[] decodeBase64Flexible(String value) {
        String clean = Objects.requireNonNull(value, "Base64 value cannot be null").trim();
        if (clean.contains("-") || clean.contains("_")) {
            return Base64.getUrlDecoder().decode(clean);
        }
        return Base64.getDecoder().decode(clean);
    }

    // ---- Canonical protocol messages shared strictly with Teacher Companion and Student Browser ----

    public String canonicalStudentTicketMessage(
            String ticketId,
            String sessionUuid,
            Long studentId,
            String studentRegNo,
            String studentEd25519PublicKey,
            String studentX25519PublicKey,
            String studentNonce,
            long issuedAtEpochMs,
            long expiresAtEpochMs) {
        return String.join("|",
                "STUDENT_TICKET_V1",
                Objects.toString(ticketId, ""),
                Objects.toString(sessionUuid, ""),
                String.valueOf(studentId),
                Objects.toString(studentRegNo, ""),
                Objects.toString(studentEd25519PublicKey, ""),
                Objects.toString(studentX25519PublicKey, ""),
                Objects.toString(studentNonce, ""),
                String.valueOf(issuedAtEpochMs),
                String.valueOf(expiresAtEpochMs)
        );
    }

    public String canonicalStudentProofMessage(
            String sessionUuid,
            String ticketId,
            String studentRegNo,
            String studentNonce,
            String teacherNonce,
            String teacherEd25519PublicKey,
            String teacherX25519PublicKey,
            long timestampEpochMs) {
        return String.join("|",
                "STUDENT_PROOF_V1",
                Objects.toString(sessionUuid, ""),
                Objects.toString(ticketId, ""),
                Objects.toString(studentRegNo, ""),
                Objects.toString(studentNonce, ""),
                Objects.toString(teacherNonce, ""),
                Objects.toString(teacherEd25519PublicKey, ""),
                Objects.toString(teacherX25519PublicKey, ""),
                String.valueOf(timestampEpochMs)
        );
    }

    public String canonicalCompanionReceiptMessage(
            String companionReceiptId,
            String sessionUuid,
            Long teacherId,
            String studentRegNo,
            String ticketId,
            String teacherNonce,
            String studentNonce,
            String clientIp,
            String teacherEd25519PublicKey,
            String teacherX25519PublicKey,
            String studentEd25519PublicKey,
            String studentX25519PublicKey,
            long issuedAtEpochMs,
            long expiresAtEpochMs) {
        return String.join("|",
                "COMPANION_RECEIPT_V1",
                Objects.toString(companionReceiptId, ""),
                Objects.toString(sessionUuid, ""),
                String.valueOf(teacherId),
                Objects.toString(studentRegNo, ""),
                Objects.toString(ticketId, ""),
                Objects.toString(teacherNonce, ""),
                Objects.toString(studentNonce, ""),
                Objects.toString(clientIp, ""),
                Objects.toString(teacherEd25519PublicKey, ""),
                Objects.toString(teacherX25519PublicKey, ""),
                Objects.toString(studentEd25519PublicKey, ""),
                Objects.toString(studentX25519PublicKey, ""),
                String.valueOf(issuedAtEpochMs),
                String.valueOf(expiresAtEpochMs)
        );
    }
}
