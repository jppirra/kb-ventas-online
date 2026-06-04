package com.jafpsoft.ventas.config;

import com.jafpsoft.ventas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;

    @Value("${app.admin.emails:${app.admin.email:}}")
    private String adminEmailsConfig;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminEmailsConfig == null || adminEmailsConfig.isBlank()) return;

        List<String> adminEmails = Arrays.stream(adminEmailsConfig.split(","))
                .map(String::trim)
                .filter(e -> !e.isBlank())
                .toList();

        for (String email : adminEmails) {
            userRepository.findByEmail(email).ifPresent(user -> {
                if (!user.isAppAdmin()) {
                    user.setAppAdmin(true);
                    userRepository.save(user);
                    log.info("Admin role granted to: {}", email);
                }
            });
        }
    }
}
