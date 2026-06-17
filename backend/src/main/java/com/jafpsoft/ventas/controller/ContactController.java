package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.contact.ContactRequest;
import com.jafpsoft.ventas.dto.contact.ContactResponse;
import com.jafpsoft.ventas.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping("/contact")
    public ResponseEntity<ContactResponse> submit(@Valid @RequestBody ContactRequest req) {
        return ResponseEntity.ok(contactService.submit(req));
    }

    @GetMapping("/admin/contact")
    public ResponseEntity<List<ContactResponse>> getAll() {
        return ResponseEntity.ok(contactService.getAll());
    }

    @GetMapping("/admin/contact/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        return ResponseEntity.ok(Map.of("count", contactService.countUnread()));
    }

    @PostMapping("/admin/contact/{id}/read")
    public ResponseEntity<ContactResponse> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(contactService.markRead(id));
    }
}
