package com.jafpsoft.ventas.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${mail.from.address:onboarding@resend.dev}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    private static final String FROM_NAME = "My App";

    // ── Core sender ───────────────────────────────────────────────────────────

    private void send(String toEmail, String subject, String html) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY not configured — skipping email to {}", toEmail);
            return;
        }
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("from", FROM_NAME + " <" + fromEmail + ">");
            body.put("to", List.of(toEmail));
            body.put("subject", subject);
            body.put("html", html);

            RestClient.create()
                    .post()
                    .uri("https://api.resend.com/emails")
                    .header("Authorization", "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Email sent to {}: {}", toEmail, subject);
        } catch (Exception e) {
            log.error("Email FAILED to {}: {}", toEmail, e.getMessage());
        }
    }

    // ── Transactional emails ──────────────────────────────────────────────────

    @Async
    public void sendVerificationEmail(String toEmail, String userName, String token) {
        String url = baseUrl + "/verify-email?token=" + token;
        String html = buildActionEmail(
                "Activá tu cuenta",
                "Hola <strong>" + userName + "</strong>, gracias por registrarte. Hacé clic para activar tu cuenta.",
                url, "Activar mi cuenta →",
                "Este link expira en 24 horas.");
        send(toEmail, "Activá tu cuenta en " + FROM_NAME, html);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String userName, String token) {
        String url = baseUrl + "/reset-password?token=" + token;
        String html = buildActionEmail(
                "Restablecer contraseña",
                "Recibimos una solicitud para restablecer la contraseña de <strong>" + userName + "</strong>.",
                url, "Restablecer contraseña →",
                "Este link expira en 24 horas. Si no solicitaste esto, podés ignorarlo.");
        send(toEmail, "Restablecer contraseña — " + FROM_NAME, html);
    }

    @Async
    public void sendAdminEmail(String toEmail, String subject, String body) {
        String html = buildActionEmail(subject, body, null, null, FROM_NAME + " — Admin");
        send(toEmail, subject, html);
    }

    // ── HTML builder ──────────────────────────────────────────────────────────

    private String buildActionEmail(String heading, String body, String ctaUrl, String ctaText, String footer) {
        String cta = ctaUrl != null ? """
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr>
              <td style="background:#6366f1;border-radius:10px;">
                <a href="%s" style="display:block;padding:13px 28px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;">%s</a>
              </td>
            </tr></table>""".formatted(ctaUrl, ctaText) : "";

        return """
            <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f5f3ff;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="padding:48px 20px;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%%;">
                    <tr><td style="background:#fff;border-radius:20px;padding:44px 48px;box-shadow:0 2px 20px rgba(99,102,241,0.10);">
                      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1e1b4b;">%s</h1>
                      <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;">%s</p>
                      %s
                      <p style="margin:0;font-size:12px;color:#9ca3af;">%s</p>
                    </td></tr>
                    <tr><td align="center" style="padding-top:20px;">
                      <p style="margin:0;font-size:12px;color:#9ca3af;">%s</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(heading, body, cta, footer, FROM_NAME);
    }
}

