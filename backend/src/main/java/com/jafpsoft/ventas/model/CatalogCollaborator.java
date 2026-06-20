package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "catalog_collaborators")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CatalogCollaborator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "collaborator_email", nullable = false)
    private String collaboratorEmail;

    @Column(name = "collaborator_user_id")
    private Long collaboratorUserId;

    @Column(name = "invite_token", length = 36, unique = true)
    private String inviteToken;

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING"; // estados posibles: PENDING, ACTIVE, REVOKED

    @Column(name = "access_all_catalogs", nullable = false)
    @Builder.Default
    private boolean accessAllCatalogs = false;

    @Column(name = "catalog_ids", columnDefinition = "TEXT")
    private String catalogIds; // arreglo JSON de IDs (Long)

    @Column(name = "can_publish", nullable = false)
    @Builder.Default
    private boolean canPublish = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
