package com.jafpsoft.ventas.scheduler;

import com.jafpsoft.ventas.model.Product;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.ProductRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import com.jafpsoft.ventas.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class StockReportScheduler {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;

    // Corre diariamente a las 8am UTC
    @Scheduled(cron = "0 0 8 * * *")
    public void sendScheduledReports() {
        LocalDate today = LocalDate.now();
        int dayOfWeek = today.getDayOfWeek().getValue(); // 1=lunes
        int dayOfMonth = today.getDayOfMonth();

        List<User> users = userRepository.findAll();
        for (User user : users) {
            String freq = user.getStockReportFrequency();
            if (freq == null || freq.equals("NONE")) continue;

            boolean shouldSend = switch (freq) {
                case "DAILY" -> true;
                case "WEEKLY" -> {
                    int cfg = user.getStockReportDayOfWeek() != null ? user.getStockReportDayOfWeek() : 1;
                    yield cfg == dayOfWeek;
                }
                case "MONTHLY" -> {
                    int cfg = user.getStockReportDayOfMonth() != null ? user.getStockReportDayOfMonth() : 1;
                    yield cfg == dayOfMonth;
                }
                default -> false;
            };

            if (shouldSend) {
                try {
                    sendReportToUser(user);
                } catch (Exception e) {
                    log.error("Error sending stock report to user {}: {}", user.getId(), e.getMessage());
                }
            }
        }
    }

    private void sendReportToUser(User user) {
        List<Product> products = productRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<Product> agotados = products.stream()
                .filter(p -> p.isShowStock() && "IN_STOCK".equals(p.getStockStatus())
                        && p.getStockCount() != null && p.getStockCount() <= 0)
                .collect(Collectors.toList());
        List<Product> enStock = products.stream()
                .filter(p -> p.isShowStock() && "IN_STOCK".equals(p.getStockStatus())
                        && p.getStockCount() != null && p.getStockCount() > 0)
                .collect(Collectors.toList());
        int totalUnidades = enStock.stream()
                .mapToInt(p -> p.getStockCount() != null ? p.getStockCount() : 0).sum();

        emailService.sendStockReport(user.getEmail(), user.getName(), agotados, enStock, totalUnidades);
    }
}
