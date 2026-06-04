package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, Long id);
}

