package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "moderation_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ModerationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // "CATALOG" o "USER"
    @Column(nullable = false, length = 20)
    private String targetType;

    @Column(nullable = false)
    private Long targetId;

    // nombre del catálogo/usuario afectado en el momento de la acción
    @Column(nullable = false)
    private String targetName;

    // "BLOCKED" o "UNBLOCKED"
    @Column(nullable = false, length = 20)
    private String action;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private Long adminId;

    @Column(nullable = false)
    private String adminName;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
