package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.notification.NotificationResponse;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal CustomUserDetails user) {
        return notificationService.listForUser(userId(user));
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal CustomUserDetails user) {
        return notificationService.unreadCount(userId(user));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id,
                                         @AuthenticationPrincipal CustomUserDetails user) {
        notificationService.markRead(id, userId(user));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal CustomUserDetails user) {
        notificationService.markAllRead(userId(user));
        return ResponseEntity.ok().build();
    }

    private Long userId(CustomUserDetails u) {
        return u.getUserId();
    }
}
