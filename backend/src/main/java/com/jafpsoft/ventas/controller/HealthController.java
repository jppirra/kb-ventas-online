package com.jafpsoft.ventas.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.version:unknown}")
    private String appVersion;

    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return ResponseEntity.ok(Map.of("status", "ok", "version", appVersion));
    }
}
