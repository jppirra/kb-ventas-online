package com.jafpsoft.ventas.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.model.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    @Value("${anthropic.api-key:}")
    private String apiKey;

    @Value("${anthropic.model:claude-haiku-4-5-20251001}")
    private String model;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public String generateProductDescription(Product product) {
        String prompt = buildProductPrompt(product);
        return callClaude(prompt);
    }

    public String generateCatalogIntro(String catalogName, List<Product> products) {
        String prompt = buildCatalogIntroPrompt(catalogName, products);
        return callClaude(prompt);
    }

    private String buildProductPrompt(Product product) {
        StringBuilder sb = new StringBuilder();
        sb.append("Eres un experto en marketing y ventas. Genera una descripción comercial atractiva y profesional para el siguiente producto.\n\n");
        sb.append("Producto: ").append(product.getName()).append("\n");
        if (product.getDescription() != null && !product.getDescription().isBlank()) {
            sb.append("Descripción original: ").append(product.getDescription()).append("\n");
        }
        if (product.getCategory() != null) {
            sb.append("Categoría: ").append(product.getCategory()).append("\n");
        }
        if (product.getPrice() != null) {
            sb.append("Precio: $").append(product.getPrice()).append("\n");
        }
        sb.append("\nEscribe una descripción de 2-3 oraciones que destaque los beneficios y genere deseo de compra. Solo la descripción, sin títulos ni aclaraciones.");
        return sb.toString();
    }

    private String buildCatalogIntroPrompt(String catalogName, List<Product> products) {
        StringBuilder sb = new StringBuilder();
        sb.append("Eres un experto en marketing. Genera una introducción atractiva para un catálogo de ventas.\n\n");
        sb.append("Nombre del catálogo: ").append(catalogName).append("\n");
        sb.append("Cantidad de productos: ").append(products.size()).append("\n");

        List<String> categories = products.stream()
                .map(Product::getCategory)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .toList();
        if (!categories.isEmpty()) {
            sb.append("Categorías: ").append(String.join(", ", categories)).append("\n");
        }

        sb.append("\nEscribe una introducción de 3-4 oraciones que invite al lector a explorar el catálogo. Solo la introducción, sin títulos ni aclaraciones.");
        return sb.toString();
    }

    private String callClaude(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("ANTHROPIC_API_KEY no configurada, usando descripción placeholder");
            return null;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", apiKey);
            headers.set("anthropic-version", "2023-06-01");

            Map<String, Object> body = Map.of(
                    "model", model,
                    "max_tokens", 512,
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.anthropic.com/v1/messages", request, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("content").get(0).path("text").asText();
        } catch (Exception e) {
            log.error("Error llamando a Claude API: {}", e.getMessage());
            return null;
        }
    }
}
