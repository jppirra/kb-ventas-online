package com.jafpsoft.ventas.hallazgos;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.EmailVerificationTokenRepository;
import com.jafpsoft.ventas.repository.PasswordResetTokenRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.security.GoogleTokenVerifier;
import com.jafpsoft.ventas.security.JwtTokenProvider;
import com.jafpsoft.ventas.security.UserDetailsServiceImpl;
import com.jafpsoft.ventas.service.AuthService;
import com.jafpsoft.ventas.service.EmailService;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PublicKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * SEC-001: el login con Google solo acepta tokens firmados por Google para esta aplicación.
 */
@Tag("hallazgo")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SEC001Test {

    private static final String CLIENT_ID = "cliente-de-prueba.apps.googleusercontent.com";
    private static final String GOOGLE = "https://accounts.google.com";
    private static final String KID = "clave-1";
    private static final String EMAIL = "admin@example.com";

    @Mock private UserRepository userRepository;
    @Mock private EmailVerificationTokenRepository emailVerificationTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private UserDetailsServiceImpl userDetailsService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private EmailService emailService;

    private AuthService authService;
    private KeyPair claveDeGoogle;

    @BeforeEach
    void setUp() throws Exception {
        claveDeGoogle = nuevaClave();
        // El verificador real, con una clave de prueba en lugar de las claves públicas de Google
        GoogleTokenVerifier verificador = new GoogleTokenVerifier(CLIENT_ID,
                kid -> KID.equals(kid) ? claveDeGoogle.getPublic() : null);
        authService = new AuthService(userRepository, emailVerificationTokenRepository,
                passwordResetTokenRepository, passwordEncoder, jwtTokenProvider, userDetailsService,
                authenticationManager, emailService, verificador);

        User existente = User.builder().id(1L).name("Admin").email(EMAIL)
                .emailVerified(true).enabled(true).appAdmin(true).build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(existente));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(new CustomUserDetails(existente));
        when(jwtTokenProvider.generateToken(any(), any())).thenReturn("sesion");
        when(jwtTokenProvider.generateRefreshToken(any())).thenReturn("renovacion");
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
    }

    @Test
    void unTokenArmadoAMano_noAbreSesion() {
        String falso = b64("{\"alg\":\"RS256\",\"typ\":\"JWT\",\"kid\":\"" + KID + "\"}") + "."
                + b64("{\"iss\":\"" + GOOGLE + "\",\"aud\":\"" + CLIENT_ID + "\","
                    + "\"sub\":\"123\",\"email\":\"" + EMAIL + "\",\"email_verified\":true,"
                    + "\"name\":\"Admin\",\"exp\":4102444800}") + "."
                + b64("firma-inventada");

        assertThrows(IllegalArgumentException.class, () -> authService.googleLogin(falso));

        verify(jwtTokenProvider, never()).generateToken(any(), any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void unTokenSinFirma_noAbreSesion() {
        String sinFirma = b64("{\"alg\":\"none\"}") + "."
                + b64("{\"iss\":\"" + GOOGLE + "\",\"aud\":\"" + CLIENT_ID + "\",\"sub\":\"123\","
                    + "\"email\":\"" + EMAIL + "\",\"email_verified\":true,\"exp\":4102444800}") + ".";

        assertThrows(IllegalArgumentException.class, () -> authService.googleLogin(sinFirma));

        verify(jwtTokenProvider, never()).generateToken(any(), any());
    }

    @Test
    void unTokenFirmadoConOtraClave_noAbreSesion() throws Exception {
        String token = token(nuevaClave(), CLIENT_ID, GOOGLE, true, 60_000);

        assertThrows(IllegalArgumentException.class, () -> authService.googleLogin(token));

        verify(jwtTokenProvider, never()).generateToken(any(), any());
    }

    @Test
    void unTokenDeGoogleParaOtraAplicacion_noAbreSesion() {
        String token = token(claveDeGoogle, "otra-aplicacion.apps.googleusercontent.com", GOOGLE, true, 60_000);

        assertThrows(IllegalArgumentException.class, () -> authService.googleLogin(token));
    }

    @Test
    void unTokenDeOtroEmisor_noAbreSesion() {
        String token = token(claveDeGoogle, CLIENT_ID, "https://emisor.example.com", true, 60_000);

        assertThrows(IllegalArgumentException.class, () -> authService.googleLogin(token));
    }

    @Test
    void unTokenVencido_noAbreSesion() {
        String token = token(claveDeGoogle, CLIENT_ID, GOOGLE, true, -600_000);

        assertThrows(IllegalArgumentException.class, () -> authService.googleLogin(token));
    }

    @Test
    void unCorreoSinVerificar_noAbreSesion() {
        String token = token(claveDeGoogle, CLIENT_ID, GOOGLE, false, 60_000);

        assertThrows(IllegalArgumentException.class, () -> authService.googleLogin(token));
    }

    @Test
    void sinClientIdConfigurado_noAbreSesion() {
        GoogleTokenVerifier sinClientId = new GoogleTokenVerifier("", kid -> claveDeGoogle.getPublic());
        String token = token(claveDeGoogle, "", GOOGLE, true, 60_000);

        assertThrows(IllegalArgumentException.class, () -> sinClientId.verify(token));
    }

    @Test
    void unTokenDeGoogleParaEstaAplicacion_abreSesion() {
        String token = token(claveDeGoogle, CLIENT_ID, GOOGLE, true, 60_000);

        assertEquals("sesion", authService.googleLogin(token).getToken());
    }

    @Test
    void lasClavesPublicadasPorGoogle_seLeenPorKid() throws Exception {
        RSAPublicKey publica = (RSAPublicKey) claveDeGoogle.getPublic();
        String jwks = "{\"keys\":[{\"kty\":\"RSA\",\"alg\":\"RS256\",\"use\":\"sig\",\"kid\":\"" + KID + "\","
                + "\"n\":\"" + b64(sinSigno(publica.getModulus())) + "\","
                + "\"e\":\"" + b64(sinSigno(publica.getPublicExponent())) + "\"}]}";

        Map<String, PublicKey> claves = GoogleTokenVerifier.parseJwks(new ObjectMapper().readTree(jwks));
        GoogleTokenVerifier verificador = new GoogleTokenVerifier(CLIENT_ID, claves::get);

        assertEquals(EMAIL, verificador.verify(token(claveDeGoogle, CLIENT_ID, GOOGLE, true, 60_000)).get("email"));
    }

    private static String token(KeyPair clave, String destinatario, String emisor,
                                boolean correoVerificado, long venceEnMs) {
        return Jwts.builder().header().keyId(KID).and()
                .issuer(emisor).audience().add(destinatario).and()
                .subject("123").claim("email", EMAIL).claim("email_verified", correoVerificado)
                .claim("name", "Admin")
                .expiration(new Date(System.currentTimeMillis() + venceEnMs))
                .signWith(clave.getPrivate()).compact();
    }

    private static KeyPair nuevaClave() throws Exception {
        KeyPairGenerator generador = KeyPairGenerator.getInstance("RSA");
        generador.initialize(2048);
        return generador.generateKeyPair();
    }

    private static String b64(String s) {
        return b64(s.getBytes(StandardCharsets.UTF_8));
    }

    private static String b64(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    // BigInteger.toByteArray() antepone un byte de signo; JWKS lo publica sin él
    private static byte[] sinSigno(BigInteger n) {
        byte[] bytes = n.toByteArray();
        return bytes[0] == 0 ? Arrays.copyOfRange(bytes, 1, bytes.length) : bytes;
    }
}
