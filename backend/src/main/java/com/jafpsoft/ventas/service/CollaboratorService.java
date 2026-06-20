package com.jafpsoft.ventas.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.dto.collaborator.CollaboratorInviteRequest;
import com.jafpsoft.ventas.dto.collaborator.CollaboratorResponse;
import com.jafpsoft.ventas.dto.collaborator.CollaboratorUpdateRequest;
import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.CatalogCollaborator;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.CatalogCollaboratorRepository;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CollaboratorService {

    private final CatalogCollaboratorRepository collaboratorRepository;
    private final CatalogRepository catalogRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    @Transactional
    public CollaboratorResponse invite(CollaboratorInviteRequest req, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        // If collaborator already exists for this owner+email, re-send / reactivate
        Optional<CatalogCollaborator> existing = collaboratorRepository
                .findByCollaboratorEmailAndOwnerId(req.getEmail().toLowerCase().trim(), ownerId);
        if (existing.isPresent()) {
            CatalogCollaborator c = existing.get();
            if ("ACTIVE".equals(c.getStatus())) {
                throw new IllegalArgumentException("Este colaborador ya tiene acceso activo");
            }
            // Reactivate / update and re-send invite
            c.setStatus("PENDING");
            c.setInviteToken(UUID.randomUUID().toString());
            c.setAccessAllCatalogs(req.isAccessAllCatalogs());
            c.setCatalogIds(serializeIds(req.getCatalogIds()));
            c.setCanPublish(req.isCanPublish());
            collaboratorRepository.save(c);
            sendInviteEmail(owner, c);
            return buildResponse(c, owner);
        }

        CatalogCollaborator collaborator = CatalogCollaborator.builder()
                .ownerId(ownerId)
                .collaboratorEmail(req.getEmail().toLowerCase().trim())
                .inviteToken(UUID.randomUUID().toString())
                .status("PENDING")
                .accessAllCatalogs(req.isAccessAllCatalogs())
                .catalogIds(serializeIds(req.getCatalogIds()))
                .canPublish(req.isCanPublish())
                .build();
        collaboratorRepository.save(collaborator);
        sendInviteEmail(owner, collaborator);
        return buildResponse(collaborator, owner);
    }

    @Transactional(readOnly = true)
    public List<CollaboratorResponse> listByOwner(Long ownerId) {
        return collaboratorRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(c -> {
                    User owner = userRepository.findById(ownerId).orElse(null);
                    return buildResponse(c, owner);
                })
                .toList();
    }

    @Transactional
    public CollaboratorResponse update(Long collaboratorId, CollaboratorUpdateRequest req, Long ownerId) {
        CatalogCollaborator c = collaboratorRepository.findByIdAndOwnerId(collaboratorId, ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Colaborador no encontrado"));
        c.setAccessAllCatalogs(req.isAccessAllCatalogs());
        c.setCatalogIds(serializeIds(req.getCatalogIds()));
        c.setCanPublish(req.isCanPublish());
        collaboratorRepository.save(c);
        User owner = userRepository.findById(ownerId).orElse(null);
        return buildResponse(c, owner);
    }

    @Transactional
    public void revoke(Long collaboratorId, Long ownerId) {
        CatalogCollaborator c = collaboratorRepository.findByIdAndOwnerId(collaboratorId, ownerId)
                .orElseThrow(() -> new EntityNotFoundException("Colaborador no encontrado"));
        c.setStatus("REVOKED");
        collaboratorRepository.save(c);
    }

    @Transactional
    public CollaboratorResponse accept(String token, Long userId) {
        CatalogCollaborator c = collaboratorRepository.findByInviteToken(token)
                .orElseThrow(() -> new EntityNotFoundException("Invitación no encontrada o inválida"));
        if ("REVOKED".equals(c.getStatus())) {
            throw new IllegalStateException("Esta invitación fue revocada");
        }
        if ("ACTIVE".equals(c.getStatus())) {
            return buildResponse(c, null);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        if (!user.getEmail().equalsIgnoreCase(c.getCollaboratorEmail())) {
            throw new IllegalArgumentException("Esta invitación es para otro correo electrónico");
        }
        c.setStatus("ACTIVE");
        c.setCollaboratorUserId(userId);
        collaboratorRepository.save(c);
        return buildResponse(c, null);
    }

    @Transactional(readOnly = true)
    public CollaboratorResponse getInviteInfo(String token) {
        CatalogCollaborator c = collaboratorRepository.findByInviteToken(token)
                .orElseThrow(() -> new EntityNotFoundException("Invitación no encontrada"));
        User owner = userRepository.findById(c.getOwnerId()).orElse(null);
        return buildResponse(c, owner);
    }

    // ── Access checks (used by CatalogService) ───────────────────────────────

    public boolean hasAccessToCatalog(Long catalogId, Long userId) {
        return getActiveCollaboratorForCatalog(catalogId, userId) != null;
    }

    public boolean canPublishCatalog(Long catalogId, Long userId) {
        CatalogCollaborator c = getActiveCollaboratorForCatalog(catalogId, userId);
        return c != null && c.isCanPublish();
    }

    public List<Long> getAccessibleCatalogIds(Long userId) {
        List<CatalogCollaborator> active = collaboratorRepository
                .findByCollaboratorUserIdAndStatus(userId, "ACTIVE");
        List<Long> result = new ArrayList<>();
        for (CatalogCollaborator c : active) {
            if (c.isAccessAllCatalogs()) {
                // Add all catalogs from the owner
                catalogRepository.findByUserIdOrderByCreatedAtDesc(c.getOwnerId())
                        .stream().filter(cat -> cat.isActive())
                        .map(Catalog::getId).forEach(result::add);
            } else {
                result.addAll(deserializeIds(c.getCatalogIds()));
            }
        }
        return result.stream().distinct().toList();
    }

    // Returns collaborator context for a specific catalog (for response enrichment)
    public CatalogCollaborator getActiveCollaboratorForCatalog(Long catalogId, Long userId) {
        List<CatalogCollaborator> active = collaboratorRepository
                .findByCollaboratorUserIdAndStatus(userId, "ACTIVE");
        for (CatalogCollaborator c : active) {
            if (c.isAccessAllCatalogs()) {
                Catalog catalog = catalogRepository.findById(catalogId).orElse(null);
                if (catalog != null && catalog.getUserId().equals(c.getOwnerId())) return c;
            } else {
                List<Long> ids = deserializeIds(c.getCatalogIds());
                if (ids.contains(catalogId)) return c;
            }
        }
        return null;
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private CollaboratorResponse buildResponse(CatalogCollaborator c, User owner) {
        CollaboratorResponse r = CollaboratorResponse.from(c);
        if (owner != null) {
            r.setCatalogNames(buildCatalogNames(c, owner.getId()));
        }
        // Enrich with collaborator user info if ACTIVE
        if (c.getCollaboratorUserId() != null) {
            userRepository.findById(c.getCollaboratorUserId()).ifPresent(u -> {
                r.setCollaboratorName(u.getName());
                r.setCollaboratorProfileImageUrl(u.getProfileImageUrl());
            });
        }
        r.setCatalogIds(deserializeIds(c.getCatalogIds()));
        return r;
    }

    private List<String> buildCatalogNames(CatalogCollaborator c, Long ownerId) {
        if (c.isAccessAllCatalogs()) return List.of("Todos los catálogos");
        List<Long> ids = deserializeIds(c.getCatalogIds());
        return ids.stream()
                .map(cid -> catalogRepository.findById(cid)
                        .filter(cat -> cat.getUserId().equals(ownerId))
                        .map(Catalog::getName).orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    private void sendInviteEmail(User owner, CatalogCollaborator collaborator) {
        emailService.sendCollaboratorInviteEmail(
                collaborator.getCollaboratorEmail(),
                owner.getName(),
                owner.getProfileImageUrl(),
                collaborator.getInviteToken()
        );
    }

    private String serializeIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return null;
        try { return objectMapper.writeValueAsString(ids); } catch (Exception e) { return null; }
    }

    private List<Long> deserializeIds(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<List<Long>>() {}); } catch (Exception e) { return List.of(); }
    }
}
