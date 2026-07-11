package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, Long id);

    // Para batch de campañas: usuarios habilitados con ID > cursor, ordenados por ID
    @Query("SELECT u FROM User u WHERE u.id > :minId AND u.enabled = true ORDER BY u.id ASC")
    List<User> findEnabledAfterIdOrderById(@Param("minId") Long minId, Pageable pageable);
}

