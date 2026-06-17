package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "user_events", indexes = {
        @Index(name = "idx_ue_user_id",    columnList = "user_id"),
        @Index(name = "idx_ue_created_at", columnList = "created_at"),
        @Index(name = "idx_ue_event_type", columnList = "event_type"),
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "page", length = 500)
    private String page;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "browser", length = 50)
    private String browser;

    @Column(name = "browser_version", length = 20)
    private String browserVersion;

    @Column(name = "os", length = 50)
    private String os;

    @Column(name = "device_type", length = 20)
    private String deviceType;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
