package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.settings.ChangePasswordRequest;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    private Long userId(CustomUserDetails u) { return u.getUserId(); }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestBody ChangePasswordRequest req,
            @AuthenticationPrincipal CustomUserDetails user) {
        settingsService.changePassword(userId(user), req);
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente"));
    }

    @DeleteMapping("/account")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(@AuthenticationPrincipal CustomUserDetails user) {
        settingsService.deleteAccount(userId(user));
    }
}
