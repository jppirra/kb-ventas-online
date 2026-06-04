package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.auth.*;
import com.jafpsoft.ventas.model.*;
import com.jafpsoft.ventas.repository.*;
import com.jafpsoft.ventas.security.JwtTokenProvider;
import com.jafpsoft.ventas.security.UserDetailsServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    @Value("${google.client-id:}")
    private String googleClientId;

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Transactional
    public Map<String, String> register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El correo ya está en uso.");
        }
        User user = userRepository.save(User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .emailVerified(false)
                .build());

        String token = UUID.randomUUID().toString();
        emailVerificationTokenRepository.save(EmailVerificationToken.builder()
                .user(user).token(token)
                .expiresAt(LocalDateTime.now().plusDays(1)).build());

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), token);
        return Map.of("message", "Registro exitoso. Revisá tu correo para activar tu cuenta.");
    }

    @Transactional
    public AuthResponse verifyEmail(String token) {
        EmailVerificationToken evt = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token de verificación inválido."));
        if (evt.getUsedAt() != null) throw new IllegalArgumentException("El token ya fue utilizado.");
        if (evt.getExpiresAt().isBefore(LocalDateTime.now())) throw new IllegalArgumentException("El token expiró.");

        User user = evt.getUser();
        user.setEmailVerified(true);
        user.setEnabled(true);
        userRepository.save(user);
        evt.setUsedAt(LocalDateTime.now());
        emailVerificationTokenRepository.save(evt);
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        if (!user.isEnabled()) throw new IllegalArgumentException("Tu cuenta está deshabilitada.");
        if (!user.isEmailVerified()) throw new IllegalArgumentException("Debés verificar tu correo primero.");
        return buildAuthResponse(user);
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String username = jwtTokenProvider.getUsernameFromToken(request.getRefreshToken());
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        if (!jwtTokenProvider.validateToken(request.getRefreshToken(), userDetails))
            throw new IllegalArgumentException("Refresh token inválido.");
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        return buildAuthResponse(user);
    }

    @Transactional
    public Map<String, String> forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("No existe ninguna cuenta con ese correo."));
        String token = UUID.randomUUID().toString();
        passwordResetTokenRepository.save(PasswordResetToken.builder()
                .user(user).token(token)
                .expiresAt(LocalDateTime.now().plusDays(1)).build());
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), token);
        return Map.of("message", "Te enviamos un correo con el link para restablecer tu contraseña.");
    }

    @Transactional
    public Map<String, String> resetPassword(ResetPasswordRequest request) {
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Token inválido."));
        if (prt.getUsedAt() != null) throw new IllegalArgumentException("El token ya fue utilizado.");
        if (prt.getExpiresAt().isBefore(LocalDateTime.now())) throw new IllegalArgumentException("El token expiró.");

        prt.getUser().setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(prt.getUser());
        prt.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(prt);
        return Map.of("message", "Contraseña restablecida correctamente.");
    }

    @Transactional
    public Map<String, String> resendVerification(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (!user.isEmailVerified()) {
                String token = UUID.randomUUID().toString();
                emailVerificationTokenRepository.save(EmailVerificationToken.builder()
                        .user(user).token(token)
                        .expiresAt(LocalDateTime.now().plusDays(1)).build());
                emailService.sendVerificationEmail(user.getEmail(), user.getName(), token);
            }
        });
        return Map.of("message", "Si el correo existe y no está verificado, recibirás un nuevo link.");
    }

    @Transactional
    public AuthResponse googleLogin(String credential) {
        Map<String, Object> data = decodeGoogleJwt(credential);
        String email = (String) data.get("email");
        String name = (String) data.getOrDefault("name", email);
        String googleId = (String) data.get("sub");

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = userRepository.save(User.builder()
                    .email(email).name(name)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .googleId(googleId).emailVerified(true).build());
        } else if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtTokenProvider.generateToken(userDetails, user.getId());
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);
        return AuthResponse.builder()
                .token(token).refreshToken(refreshToken)
                .userId(user.getId()).userName(user.getName()).email(user.getEmail())
                .appAdmin(user.isAppAdmin()).emailVerified(user.isEmailVerified())
                .termsAccepted(user.getTermsAcceptedAt() != null)
                .build();
    }

    private Map<String, Object> decodeGoogleJwt(String jwt) {
        try {
            String[] parts = jwt.split("\\.");
            if (parts.length != 3) throw new IllegalArgumentException("Token de Google inválido.");
            String payload = parts[1];
            int mod = payload.length() % 4;
            if (mod == 2) payload += "==";
            else if (mod == 3) payload += "=";
            byte[] bytes = Base64.getUrlDecoder().decode(payload);
            return new ObjectMapper().readValue(bytes, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new IllegalArgumentException("Token de Google inválido.");
        }
    }
}

