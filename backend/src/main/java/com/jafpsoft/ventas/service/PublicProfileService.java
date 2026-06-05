package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.profile.PublicCatalogPageResponse;
import com.jafpsoft.ventas.dto.profile.PublicCatalogResponse;
import com.jafpsoft.ventas.dto.profile.PublicProfileResponse;
import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.SocialLink;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.BackgroundTemplateRepository;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.ProductRepository;
import com.jafpsoft.ventas.repository.SocialLinkRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicProfileService {

    private final UserRepository userRepository;
    private final CatalogRepository catalogRepository;
    private final ProductRepository productRepository;
    private final SocialLinkRepository socialLinkRepository;
    private final BackgroundTemplateRepository backgroundTemplateRepository;

    @Transactional
    public PublicProfileResponse getPublicProfile(String slug) {
        User user = userRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Perfil no encontrado"));

        List<SocialLink> links = socialLinkRepository.findByUserIdOrderBySortOrderAsc(user.getId());
        PublicProfileResponse profile = PublicProfileResponse.from(user, links);

        List<Catalog> catalogs = catalogRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(Catalog::isActive)
                .toList();

        List<PublicCatalogResponse> catalogResponses = catalogs.stream().map(c -> {
            PublicCatalogResponse cr = PublicCatalogResponse.from(c);
            if ("PREDEFINED".equals(c.getBackgroundType()) && c.getBackgroundTemplateId() != null) {
                backgroundTemplateRepository.findById(c.getBackgroundTemplateId())
                        .ifPresent(t -> cr.setBackgroundImageUrl(t.getImageUrl()));
            }
            return cr;
        }).toList();
        profile.setCatalogs(catalogResponses);
        return profile;
    }

    @Transactional
    public void registerCatalogView(Long catalogId) {
        catalogRepository.findById(catalogId).ifPresent(c -> {
            c.setViewCount(c.getViewCount() + 1);
            catalogRepository.save(c);
        });
    }

    @Transactional
    public PublicCatalogPageResponse getCatalogById(Long catalogId) {
        Catalog catalog = catalogRepository.findById(catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Catálogo no encontrado"));

        if (!catalog.isActive()) {
            throw new EntityNotFoundException("Catálogo no disponible");
        }

        User owner = userRepository.findById(catalog.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Catálogo no disponible"));

        if (!owner.isEnabled()) {
            throw new EntityNotFoundException("Catálogo no disponible");
        }

        PublicCatalogPageResponse response = PublicCatalogPageResponse.from(catalog, owner);
        // Resolve predefined background URL
        if ("PREDEFINED".equals(catalog.getBackgroundType()) && catalog.getBackgroundTemplateId() != null) {
            backgroundTemplateRepository.findById(catalog.getBackgroundTemplateId()).ifPresent(t ->
                    response.getCatalog().setBackgroundImageUrl(t.getImageUrl())
            );
        }
        return response;
    }

    @Transactional
    public void registerWhatsappClick(Long productId) {
        productRepository.findById(productId).ifPresent(p -> {
            p.setWhatsappClicks(p.getWhatsappClicks() + 1);
            productRepository.save(p);
        });
    }
}
