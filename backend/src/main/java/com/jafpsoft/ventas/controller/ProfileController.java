package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.profile.ProfileResponse;
import com.jafpsoft.ventas.dto.profile.ProfileUpdateRequest;
import com.jafpsoft.ventas.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ProfileResponse get(@AuthenticationPrincipal UserDetails user) {
        return profileService.getProfile(id(user));
    }

    @PutMapping
    public ProfileResponse update(@Valid @RequestBody ProfileUpdateRequest req,
                                  @AuthenticationPrincipal UserDetails user) {
        return profileService.updateProfile(id(user), req);
    }

    @PostMapping("/upload/avatar")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails user) throws IOException {
        String url = profileService.uploadAvatar(id(user), file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping("/upload/banner")
    public ResponseEntity<Map<String, String>> uploadBanner(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails user) throws IOException {
        String url = profileService.uploadBanner(id(user), file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/slug-suggestion")
    public ResponseEntity<Map<String, String>> slugSuggestion(
            @AuthenticationPrincipal UserDetails user) {
        // Returns a suggested slug based on the user's name (called on first profile setup)
        ProfileResponse profile = profileService.getProfile(id(user));
        String suggested = profile.getSlug() != null
                ? profile.getSlug()
                : profileService.generateSlugFromName(profile.getName());
        return ResponseEntity.ok(Map.of("slug", suggested));
    }

    private Long id(UserDetails user) {
        return Long.parseLong(user.getUsername());
    }
}
