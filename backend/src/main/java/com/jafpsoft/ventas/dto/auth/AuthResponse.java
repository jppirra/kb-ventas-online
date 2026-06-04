package com.jafpsoft.ventas.dto.auth;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private Long userId;
    private String userName;
    private String email;
    private boolean appAdmin;
    private boolean emailVerified;
    private boolean termsAccepted;
}

