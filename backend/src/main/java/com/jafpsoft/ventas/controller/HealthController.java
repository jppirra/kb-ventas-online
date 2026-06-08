package com.jafpsoft.ventas.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.jafpsoft.ventas.service.AiService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;
    private final AiService aiService;

    @Value("${gemini.model:}")
    private String geminiModel;

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "version", "1.000.05",
            "geminiModel", geminiModel,
            "geminiKeySet", geminiApiKey.isBlank() ? "NO" : "SI"
        ));
    }

    @GetMapping("/ai-models")
    public ResponseEntity<List<String>> aiModels() {
        return ResponseEntity.ok(aiService.listAvailableModels());
    }

    @GetMapping("/openrouter-models")
    public ResponseEntity<List<String>> openrouterModels() {
        return ResponseEntity.ok(aiService.listOpenRouterFreeModels());
    }
}

