package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.profile.ProfileResponse;
import com.jafpsoft.ventas.dto.profile.ProfileUpdateRequest;
import com.jafpsoft.ventas.dto.profile.SocialLinkDto;
import com.jafpsoft.ventas.model.SocialLink;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.SocialLinkRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.text.Normalizer;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final SocialLinkRepository socialLinkRepository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        User user = findUser(userId);
        List<SocialLink> links = socialLinkRepository.findByUserIdOrderBySortOrderAsc(userId);
        return ProfileResponse.from(user, links);
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest req) {
        User user = findUser(userId);

        if (req.getSlug() != null && !req.getSlug().isBlank()) {
            String slug = req.getSlug().toLowerCase().trim();
            if (userRepository.existsBySlugAndIdNot(slug, userId)) {
                throw new IllegalArgumentException("El slug '" + slug + "' ya está en uso");
            }
            user.setSlug(slug);
        }
        if (req.getBio() != null) user.setBio(req.getBio());
        if (req.getBrandColorPrimary() != null) user.setBrandColorPrimary(req.getBrandColorPrimary());
        if (req.getBrandColorSecondary() != null) user.setBrandColorSecondary(req.getBrandColorSecondary());
        if (req.getWhatsappNumber() != null) user.setWhatsappNumber(req.getWhatsappNumber());

        if (req.getSocialLinks() != null) {
            socialLinkRepository.deleteByUserId(userId);
            List<SocialLink> links = req.getSocialLinks().stream()
                    .filter(d -> d.getUrl() != null && !d.getUrl().isBlank())
                    .map(d -> SocialLink.builder()
                            .userId(userId)
                            .platform(d.getPlatform())
                            .url(d.getUrl())
                            .sortOrder(d.getSortOrder())
                            .build())
                    .toList();
            socialLinkRepository.saveAll(links);
            userRepository.save(user);
            return ProfileResponse.from(user, links);
        }

        userRepository.save(user);
        List<SocialLink> links = socialLinkRepository.findByUserIdOrderBySortOrderAsc(userId);
        return ProfileResponse.from(user, links);
    }

    @Transactional
    public String uploadAvatar(Long userId, MultipartFile file) throws IOException {
        User user = findUser(userId);
        String url = storageService.uploadImage(file, "avatars");
        user.setProfileImageUrl(url);
        userRepository.save(user);
        return url;
    }

    @Transactional
    public String uploadBanner(Long userId, MultipartFile file) throws IOException {
        User user = findUser(userId);
        String url = storageService.uploadImage(file, "banners");
        user.setBannerImageUrl(url);
        userRepository.save(user);
        return url;
    }

    public String generateSlugFromName(String name) {
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        return normalized.length() > 40 ? normalized.substring(0, 40) : normalized;
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }
}
