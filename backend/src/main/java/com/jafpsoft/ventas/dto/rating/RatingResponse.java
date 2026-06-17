package com.jafpsoft.ventas.dto.rating;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RatingResponse {
    private Long id;
    private String userName;
    private String userEmail;
    private int score;
    private String comment;
    private LocalDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Summary {
        private long total;
        private double average;
        private Map<Integer, Long> distribution;
    }
}
