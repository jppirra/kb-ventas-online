package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.SocialLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SocialLinkRepository extends JpaRepository<SocialLink, Long> {
    List<SocialLink> findByUserIdOrderBySortOrderAsc(Long userId);
    void deleteByUserId(Long userId);
}
