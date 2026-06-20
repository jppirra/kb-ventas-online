package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.collaborator.CollaboratorInviteRequest;
import com.jafpsoft.ventas.dto.collaborator.CollaboratorResponse;
import com.jafpsoft.ventas.dto.collaborator.CollaboratorUpdateRequest;
import com.jafpsoft.ventas.service.CollaboratorService;
import com.jafpsoft.ventas.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collaborators")
@RequiredArgsConstructor
public class CollaboratorController {

    private final CollaboratorService collaboratorService;

    @PostMapping("/invite")
    @ResponseStatus(HttpStatus.CREATED)
    public CollaboratorResponse invite(@Valid @RequestBody CollaboratorInviteRequest req,
                                       @AuthenticationPrincipal CustomUserDetails user) {
        return collaboratorService.invite(req, user.getUserId());
    }

    @GetMapping
    public List<CollaboratorResponse> list(@AuthenticationPrincipal CustomUserDetails user) {
        return collaboratorService.listByOwner(user.getUserId());
    }

    @PutMapping("/{id}")
    public CollaboratorResponse update(@PathVariable Long id,
                                       @RequestBody CollaboratorUpdateRequest req,
                                       @AuthenticationPrincipal CustomUserDetails user) {
        return collaboratorService.update(id, req, user.getUserId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails user) {
        collaboratorService.revoke(id, user.getUserId());
    }

    @PostMapping("/accept/{token}")
    public CollaboratorResponse accept(@PathVariable String token,
                                       @AuthenticationPrincipal CustomUserDetails user) {
        return collaboratorService.accept(token, user.getUserId());
    }

    // Endpoint público — devuelve info de la invitación sin requerir autenticación
    @GetMapping("/invite-info/{token}")
    public CollaboratorResponse inviteInfo(@PathVariable String token) {
        return collaboratorService.getInviteInfo(token);
    }

    @GetMapping("/my-access")
    public List<Long> myAccess(@AuthenticationPrincipal CustomUserDetails user) {
        return collaboratorService.getAccessibleCatalogIds(user.getUserId());
    }
}
