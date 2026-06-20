package com.jafpsoft.ventas.security.crypto;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

@Slf4j
@Converter
@Component
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;

    @Value("${app.encryption-key:}")
    private String keyHex;

    private SecretKeySpec secretKey;

    @PostConstruct
    void init() {
        if (keyHex == null || keyHex.isBlank()) {
            log.warn("APP_ENCRYPTION_KEY not configured — MP credential encryption is DISABLED");
            return;
        }
        if (keyHex.length() != 64) {
            throw new CryptoConfigurationException(
                    "APP_ENCRYPTION_KEY must be 64 hex chars (32 bytes). Got length=" + keyHex.length());
        }
        try {
            byte[] keyBytes = HexUtils.fromHex(keyHex);
            secretKey = new SecretKeySpec(keyBytes, "AES");
        } catch (IllegalArgumentException e) {
            throw new CryptoConfigurationException("APP_ENCRYPTION_KEY is not valid hex: " + e.getMessage());
        }
    }

    @Override
    public String convertToDatabaseColumn(String plaintext) {
        if (plaintext == null) return null;
        if (secretKey == null) return plaintext;
        try {
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] cipherWithTag = cipher.doFinal(plaintext.getBytes());

            byte[] combined = new byte[IV_LENGTH + cipherWithTag.length];
            System.arraycopy(iv, 0, combined, 0, IV_LENGTH);
            System.arraycopy(cipherWithTag, 0, combined, IV_LENGTH, cipherWithTag.length);

            return Base64.getUrlEncoder().withoutPadding().encodeToString(combined);
        } catch (Exception e) {
            throw new CryptoOperationException("Encryption failed", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String ciphertext) {
        if (ciphertext == null) return null;
        if (secretKey == null) return ciphertext;
        try {
            byte[] combined = Base64.getUrlDecoder().decode(ciphertext);
            if (combined.length < IV_LENGTH + 16) {
                throw new CryptoOperationException("Ciphertext too short — possible tampering");
            }

            byte[] iv = new byte[IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, IV_LENGTH);
            byte[] cipherWithTag = new byte[combined.length - IV_LENGTH];
            System.arraycopy(combined, IV_LENGTH, cipherWithTag, 0, cipherWithTag.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(cipherWithTag));
        } catch (CryptoOperationException e) {
            throw e;
        } catch (Exception e) {
            throw new CryptoOperationException("Decryption failed — data may be tampered or key mismatch", e);
        }
    }

    private static final class HexUtils {
        static byte[] fromHex(String hex) {
            int len = hex.length();
            byte[] data = new byte[len / 2];
            for (int i = 0; i < len; i += 2) {
                data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                        + Character.digit(hex.charAt(i + 1), 16));
            }
            return data;
        }
    }
}
