package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.profile.PublicCatalogResponse;
import com.jafpsoft.ventas.dto.profile.PublicProfileResponse;
import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.SocialLink;
import com.jafpsoft.ventas.model.User;
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

        profile.setCatalogs(catalogs.stream().map(PublicCatalogResponse::from).toList());
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
    public void registerWhatsappClick(Long productId) {
        productRepository.findById(productId).ifPresent(p -> {
            p.setWhatsappClicks(p.getWhatsappClicks() + 1);
            productRepository.save(p);
        });
    }
}
