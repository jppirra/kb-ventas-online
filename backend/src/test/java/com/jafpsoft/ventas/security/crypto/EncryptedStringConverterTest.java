package com.jafpsoft.ventas.security.crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class EncryptedStringConverterTest {

    // 64 hex chars = 32 bytes para AES-256
    private static final String VALID_KEY = "0".repeat(64);

    private EncryptedStringConverter converter;

    @BeforeEach
    void setUp() {
        converter = new EncryptedStringConverter();
        ReflectionTestUtils.setField(converter, "keyHex", VALID_KEY);
        converter.init();
    }

    @Test
    void encryptAndDecrypt_roundtrip() {
        String plaintext = "access_token_super_secreto_123";
        String ciphertext = converter.convertToDatabaseColumn(plaintext);

        assertNotNull(ciphertext);
        assertNotEquals(plaintext, ciphertext);

        String decrypted = converter.convertToEntityAttribute(ciphertext);
        assertEquals(plaintext, decrypted);
    }

    @Test
    void encrypt_producesUniqueIvEachTime() {
        String plaintext = "mismo_token";
        String cipher1 = converter.convertToDatabaseColumn(plaintext);
        String cipher2 = converter.convertToDatabaseColumn(plaintext);
        // IV aleatorio → los ciphertexts deben diferir
        assertNotEquals(cipher1, cipher2);
    }

    @Test
    void encrypt_nullInput_returnsNull() {
        assertNull(converter.convertToDatabaseColumn(null));
    }

    @Test
    void decrypt_nullInput_returnsNull() {
        assertNull(converter.convertToEntityAttribute(null));
    }

    @Test
    void decrypt_tamperedCiphertext_throwsCryptoOperationException() {
        String plaintext = "token_original";
        String ciphertext = converter.convertToDatabaseColumn(plaintext);
        // Corromper el último carácter del Base64Url
        String tampered = ciphertext.substring(0, ciphertext.length() - 1) + "X";
        assertThrows(CryptoOperationException.class,
                () -> converter.convertToEntityAttribute(tampered));
    }

    @Test
    void decrypt_tooShortCiphertext_throwsCryptoOperationException() {
        // Menos de 28 bytes (IV 12 + tag 16) → debe fallar antes de descifrar
        String tooShort = "YWFh"; // "aaa" en Base64 = 3 bytes
        assertThrows(CryptoOperationException.class,
                () -> converter.convertToEntityAttribute(tooShort));
    }

    @Test
    void init_blankKey_doesNotThrow_andReturnsPlaintext() {
        EncryptedStringConverter noKey = new EncryptedStringConverter();
        ReflectionTestUtils.setField(noKey, "keyHex", "");
        noKey.init();

        String plaintext = "plaintext_sin_cifrado";
        assertEquals(plaintext, noKey.convertToDatabaseColumn(plaintext));
        assertEquals(plaintext, noKey.convertToEntityAttribute(plaintext));
    }

    @Test
    void init_invalidLengthKey_throwsCryptoConfigurationException() {
        EncryptedStringConverter badKey = new EncryptedStringConverter();
        ReflectionTestUtils.setField(badKey, "keyHex", "shortkey");
        assertThrows(CryptoConfigurationException.class, badKey::init);
    }
}
