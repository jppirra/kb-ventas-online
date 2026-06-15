package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.notification.NotificationResponse;
import com.jafpsoft.ventas.model.Notification;
import com.jafpsoft.ventas.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<NotificationResponse> listForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .limit(50)
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> unreadCount(Long userId) {
        return Map.of("count", notificationRepository.countByUserIdAndReadFalse(userId));
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notificación no encontrada"));
        if (!n.getUserId().equals(userId)) throw new EntityNotFoundException("Notificación no encontrada");
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    public Notification create(Long userId, String type, String title, String message, Long referenceId) {
        Notification n = notificationRepository.save(Notification.builder()
                .userId(userId).type(type).title(title).message(message).referenceId(referenceId)
                .build());
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(userId), "/queue/notifications", NotificationResponse.from(n));
        }
        return n;
    }
}
