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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    // ── Gemini ─────────────────────────────────────────────────────────────────
    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String geminiModel;

    // ── OpenRouter (fallback) ──────────────────────────────────────────────────
    @Value("${openrouter.api-key:}")
    private String openrouterApiKey;

    @Value("${openrouter.model:google/gemini-2.0-flash-exp:free}")
    private String openrouterModel;

    // ── Claude (comentado) ────────────────────────────────────────────────────
    @Value("${anthropic.api-key:}")
    private String claudeApiKey;

    @Value("${anthropic.model:claude-haiku-4-5-20251001}")
    private String claudeModel;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AppSettingService appSettingService;

    // ── Métodos públicos (sin cambios de firma) ────────────────────────────────

    public String generateBio(String name, String rubro, String productTypes, String tone) {
        return callAi(buildBioPrompt(name, rubro, productTypes, tone));
    }

    public String generateProductDescription(Product product) {
        return callAi(buildProductPrompt(product));
    }

    public String generateCatalogIntro(String catalogName, List<Product> products) {
        return callAi(buildCatalogIntroPrompt(catalogName, products));
    }

    // ── Dispatcher con proveedor y modelo configurables ───────────────────────

    private String callAi(String prompt) {
        String defaultProvider = (openrouterApiKey != null && !openrouterApiKey.isBlank()) ? "openrouter"
                : (geminiApiKey != null && !geminiApiKey.isBlank()) ? "gemini" : "openrouter";
        String activeProvider = appSettingService.get("ai.provider", defaultProvider);

        if ("gemini".equals(activeProvider)) {
            if (geminiApiKey != null && !geminiApiKey.isBlank()) {
                String result = callGemini(prompt);
                if (result != null) return result;
            }
            // fallback a openrouter si gemini falla
            if (openrouterApiKey != null && !openrouterApiKey.isBlank()) {
                String activeModel = appSettingService.get("ai.model.openrouter", openrouterModel);
                return callOpenRouter(prompt, activeModel);
            }
        } else {
            if (openrouterApiKey != null && !openrouterApiKey.isBlank()) {
                String activeModel = appSettingService.get("ai.model.openrouter", openrouterModel);
                return callOpenRouter(prompt, activeModel);
            }
            // fallback a gemini si openrouter falla
            if (geminiApiKey != null && !geminiApiKey.isBlank()) {
                String result = callGemini(prompt);
                if (result != null) return result;
            }
        }
        log.warn("Sin API key de IA configurada (GEMINI_API_KEY u OPENROUTER_API_KEY)");
        return null;
    }

    private static final String GEMINI_BASE = "https://generativelanguage.googleapis.com/v1/models/";

    // ── Gemini REST API ────────────────────────────────────────────────────────

    private String callGemini(String prompt) {
        try {
            String activeModel = appSettingService.get("ai.model.gemini", geminiModel);
            String url = GEMINI_BASE + activeModel + ":generateContent?key=" + geminiApiKey;

            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", prompt)))
                    ),
                    "generationConfig", Map.of(
                            "maxOutputTokens", 512,
                            "temperature", 0.7
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    url, new HttpEntity<>(body, headers), String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("Gemini API HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            log.error("Error llamando a Gemini API: {}", e.getMessage(), e);
            return null;
        }
    }

    public List<String> listAvailableModels() {
        List<String> names = new ArrayList<>();
        try {
            String url = "https://generativelanguage.googleapis.com/v1/models?key=" + geminiApiKey;
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            root.path("models").forEach(m -> names.add(m.path("name").asText()));
        } catch (Exception e) {
            names.add("ERROR: " + e.getMessage());
        }
        return names;
    }

    public List<String> listOpenRouterFreeModels() {
        List<String> names = new ArrayList<>();
        try {
            HttpHeaders headers = new HttpHeaders();
            if (openrouterApiKey != null && !openrouterApiKey.isBlank()) {
                headers.set("Authorization", "Bearer " + openrouterApiKey);
            }
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://openrouter.ai/api/v1/models",
                    org.springframework.http.HttpMethod.GET,
                    new HttpEntity<>(headers), String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            root.path("data").forEach(m -> {
                String id = m.path("id").asText();
                if (id.endsWith(":free")) names.add(id);
            });
        } catch (Exception e) {
            names.add("ERROR: " + e.getMessage());
        }
        return names;
    }

    public String testConnection(String provider, String model) {
        String prompt = "En una sola oración corta, ¿qué clima hace hoy en Córdoba, Argentina?";
        if ("openrouter".equals(provider)) {
            if (openrouterApiKey == null || openrouterApiKey.isBlank()) return "ERROR: OPENROUTER_API_KEY no configurada";
            String activeModel = appSettingService.get("ai.model.openrouter", openrouterModel);
            String m = (model != null && !model.isBlank()) ? model : activeModel;
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("Authorization", "Bearer " + openrouterApiKey);
                headers.set("HTTP-Referer", "https://mercato.jafpsoft.com");
                Map<String, Object> body = Map.of(
                        "model", m,
                        "max_tokens", 100,
                        "messages", List.of(Map.of("role", "user", "content", prompt))
                );
                ResponseEntity<String> response = restTemplate.postForEntity(
                        "https://openrouter.ai/api/v1/chat/completions",
                        new HttpEntity<>(body, headers), String.class);
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode content = root.path("choices").get(0).path("message").path("content");
                return content.isMissingNode() ? "WARN: " + response.getBody() : content.asText().trim();
            } catch (org.springframework.web.client.HttpClientErrorException e) {
                return "HTTP " + e.getStatusCode() + ": " + e.getResponseBodyAsString();
            } catch (Exception e) {
                return "ERROR: " + e.getMessage();
            }
        }
        // gemini (por defecto)
        if (geminiApiKey == null || geminiApiKey.isBlank()) return "ERROR: GEMINI_API_KEY no configurada";
        try {
            String activeModel = appSettingService.get("ai.model.gemini", geminiModel);
            String m = (model != null && !model.isBlank()) ? model : activeModel;
            String url = GEMINI_BASE + m + ":generateContent?key=" + geminiApiKey;
            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of("maxOutputTokens", 100, "temperature", 0.7)
            );
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<String> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode text = root.path("candidates").get(0).path("content").path("parts").get(0).path("text");
            return text.isMissingNode() ? "WARN: " + response.getBody() : text.asText().trim();
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            return "HTTP " + e.getStatusCode() + ": " + e.getResponseBodyAsString();
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
    }

    // ── OpenRouter REST API ────────────────────────────────────────────────────

    private String callOpenRouter(String prompt, String model) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + openrouterApiKey);
            headers.set("HTTP-Referer", "https://mercato.jafpsoft.com");

            Map<String, Object> body = Map.of(
                    "model", model,
                    "max_tokens", 512,
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            );

            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://openrouter.ai/api/v1/chat/completions",
                    new HttpEntity<>(body, headers), String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("choices").get(0).path("message").path("content").asText().trim();

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("OpenRouter HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            log.error("Error llamando a OpenRouter: {}", e.getMessage(), e);
            return null;
        }
    }

    // ── Claude REST API (fallback) ─────────────────────────────────────────────

    private String callClaude(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", claudeApiKey);
            headers.set("anthropic-version", "2023-06-01");

            Map<String, Object> body = Map.of(
                    "model", claudeModel,
                    "max_tokens", 512,
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            );

            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.anthropic.com/v1/messages",
                    new HttpEntity<>(body, headers), String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            return root.path("content").get(0).path("text").asText();

        } catch (Exception e) {
            log.error("Error llamando a Claude API: {}", e.getMessage());
            return null;
        }
    }

    // ── Prompts ────────────────────────────────────────────────────────────────

    private String buildBioPrompt(String name, String rubro, String productTypes, String tone) {
        String toneInstruction = switch (tone.toUpperCase()) {
            case "CERCANO" -> """
                Tono CERCANO y conversacional: usa primera persona ("Hola, soy..."), \
                sé cálido y accesible, como si hablaras con un amigo. Evita el lenguaje corporativo.""";
            case "CREATIVO" -> """
                Tono CREATIVO e impactante: usa metáforas, frases originales y un lenguaje \
                diferente al común. Sorprendé al lector. Podés usar alguna pregunta retórica.""";
            default -> """
                Tono PROFESIONAL: formal, orientado a la credibilidad y los resultados. \
                Destacá experiencia y propuesta de valor. Tercera persona o primera formal.""";
        };

        return """
                Eres un experto en personal branding y marketing digital.
                Escribí una bio para el perfil público de un vendedor en una plataforma de catálogos.

                Datos del vendedor:
                - Nombre: %s
                - Rubro: %s
                - Tipos de productos que vende: %s

                Instrucciones de tono:
                %s

                La bio debe tener entre 2 y 4 oraciones. Debe invitar al cliente a explorar los catálogos.
                Respondé SOLO con el texto de la bio, sin títulos, comillas ni aclaraciones.
                """.formatted(name, rubro, productTypes, toneInstruction);
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
}
