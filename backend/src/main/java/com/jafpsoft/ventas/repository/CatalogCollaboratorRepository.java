package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.CatalogCollaborator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CatalogCollaboratorRepository extends JpaRepository<CatalogCollaborator, Long> {
    List<CatalogCollaborator> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    Optional<CatalogCollaborator> findByInviteToken(String token);
    List<CatalogCollaborator> findByCollaboratorUserIdAndStatus(Long userId, String status);
    Optional<CatalogCollaborator> findByCollaboratorEmailAndOwnerId(String email, Long ownerId);
    Optional<CatalogCollaborator> findByIdAndOwnerId(Long id, Long ownerId);
}
