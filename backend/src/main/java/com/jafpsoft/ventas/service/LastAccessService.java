package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class LastAccessService {

    private final UserRepository userRepository;
    private final ConcurrentHashMap<Long, Long> lastWritten = new ConcurrentHashMap<>();
    private static final long INTERVAL_MS = 15 * 60 * 1000L; // 15 minutos

    @Async
    @Transactional
    public void record(Long userId) {
        long now = System.currentTimeMillis();
        Long last = lastWritten.get(userId);
        if (last != null && now - last < INTERVAL_MS) return;
        lastWritten.put(userId, now);
        userRepository.findById(userId).ifPresent(u -> {
            u.setLastAccessAt(LocalDateTime.now());
            userRepository.save(u);
        });
    }
}
