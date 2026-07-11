package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "mass_email_campaigns")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MassEmailCampaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // MP_ANNOUNCEMENT, etc.
    @Column(nullable = false, length = 50)
    private String type;

    // RUNNING | COMPLETED | FAILED
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "RUNNING";

    @Column(name = "total_count")
    private Integer totalCount;

    @Column(name = "sent_count", nullable = false)
    @Builder.Default
    private Integer sentCount = 0;

    @Column(name = "failed_count", nullable = false)
    @Builder.Default
    private Integer failedCount = 0;

    // Cursor: ID del último usuario procesado; próximo batch arranca desde > nextUserId
    @Column(name = "next_user_id", nullable = false)
    @Builder.Default
    private Long nextUserId = 0L;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "triggered_by")
    private Long triggeredBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
