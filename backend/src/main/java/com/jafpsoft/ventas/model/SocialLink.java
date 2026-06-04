package com.jafpsoft.ventas.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "social_links")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SocialLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 30)
    private String platform; // WHATSAPP, INSTAGRAM, LINKEDIN, FACEBOOK, TIKTOK, WEBSITE

    @Column(nullable = false)
    private String url;

    private Integer sortOrder;
}
