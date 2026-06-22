package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.MassEmailCampaign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MassEmailCampaignRepository extends JpaRepository<MassEmailCampaign, Long> {
    Optional<MassEmailCampaign> findTopByTypeAndStatusOrderByCreatedAtDesc(String type, String status);
    Optional<MassEmailCampaign> findTopByTypeOrderByCreatedAtDesc(String type);
}
