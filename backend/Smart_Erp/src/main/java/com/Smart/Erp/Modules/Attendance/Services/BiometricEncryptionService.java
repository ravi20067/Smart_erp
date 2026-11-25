package com.Smart.Erp.Modules.Attendance.Services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
public class BiometricEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int GCM_IV_LENGTH = 12;

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public BiometricEncryptionService(
            @Value("${app.security.biometric.aes-key:smart_erp_secure_biometric_aes_key_32bytes_default!}") String keyString
    ) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha.digest(keyString.getBytes(StandardCharsets.UTF_8));
            this.secretKey = new SecretKeySpec(keyBytes, "AES");
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize biometric encryption key", e);
        }
    }

    public String encryptEmbedding(List<Float> embedding) {
        if (embedding == null || embedding.isEmpty()) {
            throw new IllegalArgumentException("Embedding vector cannot be empty");
        }

        try {
            ByteBuffer buffer = ByteBuffer.allocate(embedding.size() * 4).order(ByteOrder.LITTLE_ENDIAN);
            for (Float val : embedding) {
                buffer.putFloat(val != null ? val : 0.0f);
            }
            byte[] rawBytes = buffer.array();

            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            byte[] cipherText = cipher.doFinal(rawBytes);

            ByteBuffer combined = ByteBuffer.allocate(iv.length + cipherText.length);
            combined.put(iv);
            combined.put(cipherText);

            return Base64.getEncoder().encodeToString(combined.array());
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting biometric embedding at rest", e);
        }
    }

    public List<Float> decryptEmbedding(String encryptedBase64) {
        if (encryptedBase64 == null || encryptedBase64.isBlank()) {
            throw new IllegalArgumentException("Encrypted embedding cannot be blank");
        }

        try {
            byte[] combined = Base64.getDecoder().decode(encryptedBase64);
            if (combined.length <= GCM_IV_LENGTH) {
                throw new IllegalArgumentException("Encrypted data is too short");
            }

            ByteBuffer buffer = ByteBuffer.wrap(combined);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);

            byte[] cipherText = new byte[buffer.remaining()];
            buffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            byte[] rawBytes = cipher.doFinal(cipherText);
            ByteBuffer floatBuffer = ByteBuffer.wrap(rawBytes).order(ByteOrder.LITTLE_ENDIAN);

            List<Float> result = new ArrayList<>(rawBytes.length / 4);
            while (floatBuffer.hasRemaining()) {
                result.add(floatBuffer.getFloat());
            }

            return result;
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting biometric embedding from secure storage", e);
        }
    }
}
