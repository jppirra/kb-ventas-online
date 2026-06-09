package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.admin.*;
import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.CatalogReport;
import com.jafpsoft.ventas.model.CatalogStatus;
import com.jafpsoft.ventas.model.OrderRequest;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.CatalogReportRepository;
import com.jafpsoft.ventas.repository.OrderRequestRepository;
import com.jafpsoft.ventas.repository.ProductRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final CatalogRepository catalogRepository;
    private final ProductRepository productRepository;
    private final OrderRequestRepository orderRequestRepository;
    private final CatalogReportRepository catalogReportRepository;
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
    public AdminUserResponse toggleUserEnabled(Long userId) {
        User user = findUser(userId);
        user.setEnabled(!user.isEnabled());
        return AdminUserResponse.from(userRepository.save(user), 0);
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
        userRepository.delete(user);
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
    public AdminCatalogResponse toggleCatalogActive(Long catalogId) {
        Catalog catalog = catalogRepository.findById(catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Catálogo no encontrado"));
        catalog.setActive(!catalog.isActive());
        User owner = userRepository.findById(catalog.getUserId()).orElse(null);
        return AdminCatalogResponse.from(catalogRepository.save(catalog), owner);
    }

    @Transactional
    public void deleteCatalog(Long catalogId) {
        Catalog catalog = catalogRepository.findById(catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Catálogo no encontrado"));
        catalogRepository.delete(catalog);
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
                    User owner = cat != null ? userMap.get(cat.getUserId()) : null;
                    String vendorName = owner != null ? owner.getName() : "Desconocido";
                    String vendorEmail = owner != null ? owner.getEmail() : "";
                    long total = catalogReportRepository.countByCatalogId(r.getCatalogId());
                    return AdminReportResponse.from(r, catalogName, vendorName, vendorEmail, total);
                })
                .toList();
    }

    public void sendTestEmail(AdminEmailRequest req) {
        emailService.sendAdminEmail(req.getTo(), req.getSubject(), req.getBody());
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }
}
