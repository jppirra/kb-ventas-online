package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.admin.*;
import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.CatalogReport;
import com.jafpsoft.ventas.model.CatalogStatus;
import com.jafpsoft.ventas.model.EmailVerificationToken;
import com.jafpsoft.ventas.model.ModerationLog;
import com.jafpsoft.ventas.model.OrderRequest;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.CatalogReportRepository;
import com.jafpsoft.ventas.repository.EmailVerificationTokenRepository;
import com.jafpsoft.ventas.repository.ModerationLogRepository;
import com.jafpsoft.ventas.repository.OrderRequestRepository;
import com.jafpsoft.ventas.repository.PasswordResetTokenRepository;
import com.jafpsoft.ventas.repository.ProductRepository;
import com.jafpsoft.ventas.repository.RatingRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final CatalogRepository catalogRepository;
    private final ProductRepository productRepository;
    private final OrderRequestRepository orderRequestRepository;
    private final CatalogReportRepository catalogReportRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RatingRepository ratingRepository;
    private final ModerationLogRepository moderationLogRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        List<User> users = userRepository.findAll();
        List<Catalog> catalogs = catalogRepository.findAll();

        long totalWaClicks = productRepository.findAll().stream()
                .mapToLong(p -> p.getWhatsappClicks() != null ? p.getWhatsappClicks() : 0L)
                .sum();
        long totalCatalogViews = catalogs.stream()
                .mapToLong(c -> c.getViewCount() != null ? c.getViewCount() : 0L)
                .sum();
        long totalProfileViews = users.stream()
                .mapToLong(u -> u.getProfileViewCount() != null ? u.getProfileViewCount() : 0L)
                .sum();

        return AdminStatsResponse.builder()
                .totalUsers(users.size())
                .enabledUsers(users.stream().filter(User::isEnabled).count())
                .adminUsers(users.stream().filter(User::isAppAdmin).count())
                .totalCatalogs(catalogs.size())
                .activeCatalogs(catalogs.stream().filter(Catalog::isActive).count())
                .generatedCatalogs(catalogs.stream().filter(c -> c.getStatus() == CatalogStatus.GENERATED).count())
                .totalProducts(productRepository.count())
                .totalCatalogViews(totalCatalogViews)
                .totalProfileViews(totalProfileViews)
                .totalWhatsappClicks(totalWaClicks)
                .totalOrders(orderRequestRepository.count())
                .respondedOrders(orderRequestRepository.countByStatusNot("PENDING"))
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        List<User> users = userRepository.findAll();
        Map<Long, Long> catalogCounts = catalogRepository.findAll().stream()
                .collect(Collectors.groupingBy(Catalog::getUserId, Collectors.counting()));

        return users.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(u -> AdminUserResponse.from(u, Math.toIntExact(catalogCounts.getOrDefault(u.getId(), 0L))))
                .toList();
    }

    @Transactional
    public AdminUserResponse toggleUserEnabled(Long userId, String reason, Long adminId, String adminName) {
        User user = findUser(userId);
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
        moderationLogRepository.save(ModerationLog.builder()
                .targetType("USER")
                .targetId(userId)
                .targetName(user.getName() != null ? user.getName() : user.getEmail())
                .action(user.isEnabled() ? "UNBLOCKED" : "BLOCKED")
                .reason(reason)
                .adminId(adminId)
                .adminName(adminName)
                .build());
        return AdminUserResponse.from(user, 0);
    }

    @Transactional(readOnly = true)
    public List<ModerationLogResponse> getModerationLog(String targetType, Long targetId) {
        return moderationLogRepository
                .findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId)
                .stream()
                .map(ModerationLogResponse::from)
                .toList();
    }

    @Transactional
    public AdminUserResponse toggleUserAdmin(Long userId) {
        User user = findUser(userId);
        user.setAppAdmin(!user.isAppAdmin());
        return AdminUserResponse.from(userRepository.save(user), 0);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = findUser(userId);
        if (user.isAppAdmin()) throw new IllegalStateException("No se puede eliminar un administrador");
        purgeUserDependencies(user);
        userRepository.delete(user);
    }

    private void purgeUserDependencies(User user) {
        emailVerificationTokenRepository.deleteByUser(user);
        passwordResetTokenRepository.deleteByUser(user);
        ratingRepository.deleteByUser(user);
    }

    private void purgeCatalogDependencies(Long catalogId) {
        productRepository.unlinkAllFromCatalog(catalogId);
        catalogReportRepository.deleteAllByCatalogId(catalogId);
    }

    @Transactional
    public AdminUserResponse updateUserEmail(Long userId, String newEmail) {
        if (newEmail == null || newEmail.isBlank()) throw new IllegalArgumentException("Email inválido");
        String email = newEmail.trim().toLowerCase();
        if (userRepository.findByEmail(email).filter(u -> !u.getId().equals(userId)).isPresent()) {
            throw new IllegalStateException("El email ya está en uso por otro usuario");
        }
        User user = findUser(userId);
        user.setEmail(email);
        user.setEmailVerified(false);
        return AdminUserResponse.from(userRepository.save(user), 0);
    }

    @Transactional
    public String resetUserPassword(Long userId) {
        User user = findUser(userId);
        String tempPassword = generateTempPassword();
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        userRepository.save(user);
        return tempPassword;
    }

    // ── Bulk operations ────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Integer> bulkBlock(List<Long> ids, String reason, Long adminId, String adminName) {
        int processed = 0, skipped = 0;
        for (Long id : ids) {
            User user = userRepository.findById(id).orElse(null);
            if (user == null || user.isAppAdmin() || !user.isEnabled()) { skipped++; continue; }
            user.setEnabled(false);
            userRepository.save(user);
            moderationLogRepository.save(ModerationLog.builder()
                    .targetType("USER").targetId(id)
                    .targetName(user.getName() != null ? user.getName() : user.getEmail())
                    .action("BLOCKED").reason(reason).adminId(adminId).adminName(adminName).build());
            processed++;
        }
        return Map.of("processed", processed, "skipped", skipped);
    }

    @Transactional
    public Map<String, Integer> bulkUnblock(List<Long> ids, String reason, Long adminId, String adminName) {
        int processed = 0, skipped = 0;
        for (Long id : ids) {
            User user = userRepository.findById(id).orElse(null);
            if (user == null || user.isEnabled()) { skipped++; continue; }
            user.setEnabled(true);
            userRepository.save(user);
            moderationLogRepository.save(ModerationLog.builder()
                    .targetType("USER").targetId(id)
                    .targetName(user.getName() != null ? user.getName() : user.getEmail())
                    .action("UNBLOCKED").reason(reason).adminId(adminId).adminName(adminName).build());
            processed++;
        }
        return Map.of("processed", processed, "skipped", skipped);
    }

    @Transactional
    public Map<String, Integer> bulkResendVerification(List<Long> ids) {
        int processed = 0, skipped = 0;
        for (Long id : ids) {
            User user = userRepository.findById(id).orElse(null);
            if (user == null || user.isEmailVerified()) { skipped++; continue; }
            String token = UUID.randomUUID().toString();
            emailVerificationTokenRepository.save(EmailVerificationToken.builder()
                    .user(user).token(token)
                    .expiresAt(LocalDateTime.now().plusDays(1)).build());
            emailService.sendVerificationEmail(user.getEmail(),
                    user.getName() != null ? user.getName() : user.getEmail(), token);
            processed++;
        }
        return Map.of("processed", processed, "skipped", skipped);
    }

    @Transactional
    public Map<String, Integer> bulkResetPasswordByEmail(List<Long> ids) {
        int processed = 0, skipped = 0;
        for (Long id : ids) {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) { skipped++; continue; }
            String tempPassword = generateTempPassword();
            user.setPasswordHash(passwordEncoder.encode(tempPassword));
            userRepository.save(user);
            emailService.sendTempPasswordEmail(user.getEmail(),
                    user.getName() != null ? user.getName() : user.getEmail(), tempPassword);
            processed++;
        }
        return Map.of("processed", processed, "skipped", skipped);
    }

    @Transactional
    public Map<String, Integer> bulkDelete(List<Long> ids, Long currentAdminId) {
        int processed = 0, skipped = 0;
        for (Long id : ids) {
            User user = userRepository.findById(id).orElse(null);
            if (user == null || user.isAppAdmin() || id.equals(currentAdminId)) { skipped++; continue; }
            purgeUserDependencies(user);
            userRepository.delete(user);
            processed++;
        }
        return Map.of("processed", processed, "skipped", skipped);
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public List<AdminCatalogResponse> getAllCatalogs() {
        List<Catalog> catalogs = catalogRepository.findAll();
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return catalogs.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(c -> AdminCatalogResponse.from(c, userMap.get(c.getUserId())))
                .toList();
    }

    @Transactional
    public AdminCatalogResponse toggleCatalogActive(Long catalogId, String reason, Long adminId, String adminName) {
        Catalog catalog = catalogRepository.findById(catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Catálogo no encontrado"));
        catalog.setActive(!catalog.isActive());
        catalogRepository.save(catalog);
        moderationLogRepository.save(ModerationLog.builder()
                .targetType("CATALOG")
                .targetId(catalogId)
                .targetName(catalog.getName())
                .action(catalog.isActive() ? "UNBLOCKED" : "BLOCKED")
                .reason(reason)
                .adminId(adminId)
                .adminName(adminName)
                .build());
        User owner = userRepository.findById(catalog.getUserId()).orElse(null);
        return AdminCatalogResponse.from(catalog, owner);
    }

    @Transactional
    public void deleteCatalog(Long catalogId) {
        Catalog catalog = catalogRepository.findById(catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Catálogo no encontrado"));
        purgeCatalogDependencies(catalogId);
        catalogRepository.delete(catalog);
    }

    @Transactional
    public Map<String, Integer> bulkBlockCatalogs(List<Long> ids, String reason, Long adminId, String adminName) {
        int processed = 0, skipped = 0;
        for (Long id : ids) {
            Catalog catalog = catalogRepository.findById(id).orElse(null);
            if (catalog == null || !catalog.isActive()) { skipped++; continue; }
            catalog.setActive(false);
            catalogRepository.save(catalog);
            moderationLogRepository.save(ModerationLog.builder()
                    .targetType("CATALOG").targetId(id).targetName(catalog.getName())
                    .action("BLOCKED").reason(reason).adminId(adminId).adminName(adminName).build());
            processed++;
        }
        return Map.of("processed", processed, "skipped", skipped);
    }

    @Transactional
    public Map<String, Integer> bulkUnblockCatalogs(List<Long> ids, String reason, Long adminId, String adminName) {
        int processed = 0, skipped = 0;
        for (Long id : ids) {
            Catalog catalog = catalogRepository.findById(id).orElse(null);
            if (catalog == null || catalog.isActive()) { skipped++; continue; }
            catalog.setActive(true);
            catalogRepository.save(catalog);
            moderationLogRepository.save(ModerationLog.builder()
                    .targetType("CATALOG").targetId(id).targetName(catalog.getName())
                    .action("UNBLOCKED").reason(reason).adminId(adminId).adminName(adminName).build());
            processed++;
        }
        return Map.of("processed", processed, "skipped", skipped);
    }

    @Transactional
    public Map<String, Integer> bulkDeleteCatalogs(List<Long> ids) {
        int processed = 0, skipped = 0;
        for (Long id : ids) {
            Catalog catalog = catalogRepository.findById(id).orElse(null);
            if (catalog == null) { skipped++; continue; }
            purgeCatalogDependencies(id);
            catalogRepository.delete(catalog);
            processed++;
        }
        return Map.of("processed", processed, "skipped", skipped);
    }

    @Transactional(readOnly = true)
    public List<AdminOrderResponse> getAllOrders() {
        List<OrderRequest> orders = orderRequestRepository.findAll();
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return orders.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(o -> AdminOrderResponse.from(o, userMap.get(o.getVendorUserId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminReportResponse> getAdminReports() {
        List<CatalogReport> reports = catalogReportRepository.findAll();
        Map<Long, Catalog> catalogMap = catalogRepository.findAll().stream()
                .collect(Collectors.toMap(Catalog::getId, c -> c));
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return reports.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(r -> {
                    Catalog cat = catalogMap.get(r.getCatalogId());
                    String catalogName = cat != null ? cat.getName() : "Desconocido";
                    String catalogPublicId = cat != null ? cat.getPublicId() : null;
                    User owner = cat != null ? userMap.get(cat.getUserId()) : null;
                    String vendorName = owner != null ? owner.getName() : "Desconocido";
                    String vendorEmail = owner != null ? owner.getEmail() : "";
                    long total = catalogReportRepository.countByCatalogId(r.getCatalogId());
                    return AdminReportResponse.from(r, catalogPublicId, catalogName, vendorName, vendorEmail, total);
                })
                .toList();
    }

    public void sendTestEmail(AdminEmailRequest req) {
        emailService.sendAdminEmail(req.getTo(), req.getSubject(), req.getBody());
    }

    @Transactional
    public void resendVerificationEmail(Long userId) {
        User user = findUser(userId);
        String token = UUID.randomUUID().toString();
        EmailVerificationToken evt = EmailVerificationToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();
        emailVerificationTokenRepository.save(evt);
        emailService.sendVerificationEmail(user.getEmail(), user.getName(), token);
    }

    @Transactional
    public AdminUserResponse verifyEmailDirectly(Long userId) {
        User user = findUser(userId);
        user.setEmailVerified(true);
        user.setEnabled(true);
        return AdminUserResponse.from(userRepository.save(user), 0);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }
}
