package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "to_email", nullable = false)
    private String toEmail;

    @Column(length = 50)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String subject;

    @Column(length = 10, nullable = false)
    private String status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "sent_at", nullable = false, updatable = false)
    private LocalDateTime sentAt;
}
