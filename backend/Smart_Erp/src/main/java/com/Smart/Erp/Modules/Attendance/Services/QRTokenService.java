package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Modules.Attendance.DTO.TeacherQRPayload;
import com.Smart.Erp.Modules.Attendance.Entity.QRTokenUsage;
import com.Smart.Erp.Modules.Attendance.Repo.QRTokenUsageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
public class QRTokenService {

    private final String hmacSecret;
    private final StringRedisTemplate redisTemplate;
    private final QRTokenUsageRepository qrTokenUsageRepository;
    private final ObjectMapper objectMapper;

    public QRTokenService(
            @Value("${app.security.qr.hmac-secret:smart_erp_secure_attendance_hmac_secret_key_default}") String hmacSecret,
            StringRedisTemplate redisTemplate,
            QRTokenUsageRepository qrTokenUsageRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) ObjectMapper objectMapper
    ) {
        this.hmacSecret = hmacSecret;
        this.redisTemplate = redisTemplate;
        this.qrTokenUsageRepository = qrTokenUsageRepository;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public String generateTeacherQRPayload(
            String sessionUuid,
            Long teacherId,
            String localServerIp,
            Integer localServerPort,
            int validitySeconds
    ) {
        return generateTeacherQRPayload(
                sessionUuid,
                teacherId,
                localServerIp,
                localServerPort,
                null,
                null,
                null,
                null,
                validitySeconds
        );
    }

    public String generateTeacherQRPayload(
            String sessionUuid,
            Long teacherId,
            String localServerIp,
            Integer localServerPort,
            String teacherEd25519PublicKey,
            String teacherX25519PublicKey,
            String allowedSubnets,
            String backendPublicKey,
            int validitySeconds
    ) {
        long now = System.currentTimeMillis();
        long expiresAt = now + (validitySeconds * 1000L);
        String nonce = UUID.randomUUID().toString().replace("-", "");

        String rawData = buildTeacherQrSigningString(
                sessionUuid,
                teacherId,
                localServerIp,
                localServerPort,
                teacherEd25519PublicKey,
                teacherX25519PublicKey,
                allowedSubnets,
                backendPublicKey,
                now,
                expiresAt,
                nonce
        );

        String signature = computeHmacSha256(rawData, hmacSecret);

        TeacherQRPayload payload = TeacherQRPayload.builder()
                .sessionId(sessionUuid)
                .teacherId(teacherId)
                .localServerIp(localServerIp)
                .localServerPort(localServerPort)
                .teacherEd25519PublicKey(teacherEd25519PublicKey)
                .teacherX25519PublicKey(teacherX25519PublicKey)
                .allowedSubnets(allowedSubnets)
                .backendPublicKey(backendPublicKey)
                .timestamp(now)
                .expiresAt(expiresAt)
                .nonce(nonce)
                .signature(signature)
                .build();

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize Teacher QR payload", e);
        }
    }

    public boolean verifyTeacherQRPayload(TeacherQRPayload payload) {
        if (payload == null || payload.getSessionId() == null || payload.getNonce() == null
                || payload.getSignature() == null || payload.getSignature().isBlank()) {
            return false;
        }

        long now = System.currentTimeMillis();
        if (payload.getTimestamp() <= 0 || payload.getExpiresAt() < payload.getTimestamp() || now > payload.getExpiresAt()) {
            log.warn("Teacher QR expired or invalid timestamps: now={}, expiresAt={}", now, payload.getExpiresAt());
            return false;
        }

        String rawData = buildTeacherQrSigningString(
                payload.getSessionId(),
                payload.getTeacherId(),
                payload.getLocalServerIp(),
                payload.getLocalServerPort(),
                payload.getTeacherEd25519PublicKey(),
                payload.getTeacherX25519PublicKey(),
                payload.getAllowedSubnets(),
                payload.getBackendPublicKey(),
                payload.getTimestamp(),
                payload.getExpiresAt(),
                payload.getNonce()
        );

        String expectedSignature = computeHmacSha256(rawData, hmacSecret);
        return MessageDigest.isEqual(
                expectedSignature.getBytes(StandardCharsets.UTF_8),
                payload.getSignature().trim().getBytes(StandardCharsets.UTF_8)
        );
    }

    private String buildTeacherQrSigningString(
            String sessionUuid,
            Long teacherId,
            String localServerIp,
            Integer localServerPort,
            String teacherEd25519PublicKey,
            String teacherX25519PublicKey,
            String allowedSubnets,
            String backendPublicKey,
            long timestamp,
            long expiresAt,
            String nonce
    ) {
        return String.join("|",
                Objects.toString(sessionUuid, ""),
                String.valueOf(teacherId),
                Objects.toString(localServerIp, ""),
                String.valueOf(localServerPort != null ? localServerPort : 0),
                Objects.toString(teacherEd25519PublicKey, ""),
                Objects.toString(teacherX25519PublicKey, ""),
                Objects.toString(allowedSubnets, ""),
                Objects.toString(backendPublicKey, ""),
                String.valueOf(timestamp),
                String.valueOf(expiresAt),
                Objects.toString(nonce, "")
        );
    }

    public boolean consumeNonce(String nonce, String tokenType, String sessionId, Long userId, long ttlSeconds) {
        if (nonce == null || nonce.isBlank()) {
            return false;
        }

        String redisKey = "attendance:nonce:" + nonce;
        Boolean isNew = redisTemplate.opsForValue().setIfAbsent(redisKey, "1", Duration.ofSeconds(ttlSeconds));
        if (Boolean.FALSE.equals(isNew)) {
            log.warn("Replay attack detected: nonce {} already used in Redis", nonce);
            return false;
        }

        if (qrTokenUsageRepository.existsByTokenNonce(nonce)) {
            log.warn("Replay attack detected: nonce {} already recorded in database", nonce);
            return false;
        }

        QRTokenUsage usage = QRTokenUsage.builder()
                .tokenNonce(nonce)
                .tokenType(tokenType)
                .sessionId(sessionId)
                .userId(userId)
                .usedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusSeconds(ttlSeconds))
                .build();

        qrTokenUsageRepository.save(usage);
        return true;
    }

    public String generateCheckInToken(String sessionUuid, Long studentId, int ttlSeconds) {
        String token = UUID.randomUUID().toString();
        String redisKey = "attendance:checkin_token:" + token;
        String val = sessionUuid + ":" + studentId;
        redisTemplate.opsForValue().set(redisKey, val, Duration.ofSeconds(ttlSeconds));
        return token;
    }

    public String validateAndConsumeCheckInToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        String redisKey = "attendance:checkin_token:" + token;
        String val = redisTemplate.opsForValue().get(redisKey);
        // Note: Guard can scan, view student details, and then approve/reject.
        // We do not delete immediately on first read, but delete on decision.
        return val;
    }

    public void invalidateCheckInToken(String token) {
        if (token != null) {
            redisTemplate.delete("attendance:checkin_token:" + token);
        }
    }

    private String computeHmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hmacBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error calculating HMAC-SHA256", e);
        }
    }
}
