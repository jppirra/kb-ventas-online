package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.settings.ChangePasswordRequest;
import com.jafpsoft.ventas.dto.settings.StockReportConfigRequest;
import java.util.Map;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña actual es incorrecta");
        }
        if (req.getNewPassword() == null || req.getNewPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe tener al menos 6 caracteres");
        }
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    public Map<String, Object> getStockReportConfig(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        return Map.of(
                "frequency", user.getStockReportFrequency() != null ? user.getStockReportFrequency() : "NONE",
                "dayOfWeek", user.getStockReportDayOfWeek() != null ? user.getStockReportDayOfWeek() : 1,
                "dayOfMonth", user.getStockReportDayOfMonth() != null ? user.getStockReportDayOfMonth() : 1
        );
    }

    @Transactional
    public void saveStockReportConfig(Long userId, StockReportConfigRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        user.setStockReportFrequency(req.getFrequency() != null ? req.getFrequency() : "NONE");
        user.setStockReportDayOfWeek(req.getDayOfWeek());
        user.setStockReportDayOfMonth(req.getDayOfMonth());
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        if (user.isAppAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los administradores no pueden eliminar su propia cuenta");
        }
        userRepository.delete(user);
    }
}
