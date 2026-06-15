package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.order.OrderRequestPayload;
import com.jafpsoft.ventas.model.EmailLog;
import com.jafpsoft.ventas.repository.EmailLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${mail.from.address:onboarding@resend.dev}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    private final EmailLogRepository emailLogRepository;
    private final AppSettingService settings;

    private String fromName() {
        return settings.get("email.from_name", "Mercato");
    }

    private String primaryColor() {
        return settings.get("email.primary_color", "#6366f1");
    }

    // ── Core sender ───────────────────────────────────────────────────────────

    private void send(String toEmail, String type, String subject, String html) {
        String status = "SUCCESS";
        String errorMessage = null;

        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY not configured — skipping email to {}", toEmail);
            status = "FAILED";
            errorMessage = "RESEND_API_KEY no configurada";
        } else {
            try {
                Map<String, Object> body = new HashMap<>();
                body.put("from", fromName() + " <" + fromEmail + ">");
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
                status = "FAILED";
                errorMessage = e.getMessage();
            }
        }

        try {
            emailLogRepository.save(EmailLog.builder()
                    .toEmail(toEmail)
                    .type(type)
                    .subject(subject)
                    .status(status)
                    .errorMessage(errorMessage)
                    .build());
        } catch (Exception e) {
            log.error("Failed to save email log: {}", e.getMessage());
        }
    }

    // ── Transactional emails ──────────────────────────────────────────────────

    @Async
    public void sendVerificationEmail(String toEmail, String userName, String token) {
        String url = baseUrl + "/verify-email?token=" + token;
        String subject = settings.get("email.verification.subject", "Activá tu cuenta en " + fromName());
        String ctaText = settings.get("email.verification.cta_text", "Activar mi cuenta →");
        String footer = settings.get("email.verification.footer", "Este link expira en 24 horas.");
        String html = buildActionEmail(
                "Activá tu cuenta",
                "Hola <strong>" + userName + "</strong>, gracias por registrarte. Hacé clic para activar tu cuenta.",
                url, ctaText, footer);
        send(toEmail, "VERIFICATION", subject, html);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String userName, String token) {
        String url = baseUrl + "/reset-password?token=" + token;
        String subject = settings.get("email.reset.subject", "Restablecer contraseña — " + fromName());
        String ctaText = settings.get("email.reset.cta_text", "Restablecer contraseña →");
        String footer = settings.get("email.reset.footer", "Este link expira en 24 horas. Si no solicitaste esto, podés ignorarlo.");
        String html = buildActionEmail(
                "Restablecer contraseña",
                "Recibimos una solicitud para restablecer la contraseña de <strong>" + userName + "</strong>.",
                url, ctaText, footer);
        send(toEmail, "RESET", subject, html);
    }

    @Async
    public void sendCatalogPausedEmail(String toEmail, String vendorName, String catalogName, long reportCount) {
        String body = """
            Hola <strong>%s</strong>,<br><br>
            Tu catálogo <strong>"%s"</strong> ha recibido <strong>%d denuncias</strong> y fue pausado automáticamente para revisión.<br><br>
            Nuestro equipo revisará el contenido y te contactará a la brevedad.
            """.formatted(vendorName, catalogName, reportCount);
        String html = buildActionEmail("Tu catálogo fue pausado", body, null, null, fromName() + " — Moderación");
        send(toEmail, "CATALOG_PAUSED", "Catálogo pausado: " + catalogName, html);
    }

    @Async
    public void sendAdminEmail(String toEmail, String subject, String body) {
        String html = buildActionEmail(subject, body, null, null, fromName() + " — Admin");
        send(toEmail, "ADMIN", subject, html);
    }

    @Async
    public void sendTestEmail(String toEmail) {
        String html = buildActionEmail(
                "Email de prueba",
                "Este es un email de prueba enviado desde el panel de administración de <strong>" + fromName() + "</strong>.<br><br>Si lo recibiste, la configuración de Resend está funcionando correctamente.",
                null, null,
                fromName() + " — Admin");
        send(toEmail, "TEST", "Email de prueba — " + fromName(), html);
    }

    @Async
    public void sendContactNotification(String name, String email, String subject, String message) {
        String html = buildActionEmail(
                "Nuevo mensaje de contacto",
                "De: <strong>" + name + "</strong> (" + email + ")<br>" +
                "Asunto: <strong>" + subject + "</strong><br><br>" + message,
                null, null,
                fromName() + " — Admin");
        send(fromEmail, "CONTACT", "Contacto: " + subject + " — " + fromName(), html);
    }

    @Async
    public void sendOrderRequestEmail(String toEmail, String vendorName, String catalogName,
                                      Long catalogId, String customerName,
                                      List<OrderRequestPayload.Item> items, BigDecimal total) {
        StringBuilder rows = new StringBuilder();
        for (OrderRequestPayload.Item item : items) {
            BigDecimal unitPrice = item.getOfferPrice() != null ? item.getOfferPrice() : item.getPrice();
            BigDecimal subtotal = unitPrice != null ? unitPrice.multiply(BigDecimal.valueOf(item.getQuantity())) : BigDecimal.ZERO;
            rows.append("<tr>")
                .append("<td style='padding:6px 0;border-bottom:1px solid #f3f4f6;color:#374151;'>")
                .append(item.getProductName()).append(" × ").append(item.getQuantity())
                .append("</td>")
                .append("<td style='padding:6px 0;border-bottom:1px solid #f3f4f6;color:#374151;text-align:right;'>")
                .append(item.getOfferPrice() != null
                        ? "$" + String.format("%,.0f", item.getOfferPrice()) + " <s style='color:#9ca3af'>$" + String.format("%,.0f", item.getPrice()) + "</s>"
                        : (unitPrice != null ? "$" + String.format("%,.0f", unitPrice) : "-"))
                .append("</td>")
                .append("<td style='padding:6px 0;border-bottom:1px solid #f3f4f6;color:#374151;text-align:right;font-weight:600;'>")
                .append("$").append(String.format("%,.0f", subtotal))
                .append("</td>")
                .append("</tr>");
        }

        String body = """
            Hola <strong>%s</strong>,<br><br>
            Recibiste una nueva solicitud de pedido a través de tu catálogo <strong>"%s"</strong>.<br><br>
            <strong>Cliente:</strong> %s<br><br>
            <table width="100%%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:8px 0;text-align:left;font-size:13px;color:#6b7280;font-weight:600;">Producto</th>
                  <th style="padding:8px 0;text-align:right;font-size:13px;color:#6b7280;font-weight:600;">Precio unit.</th>
                  <th style="padding:8px 0;text-align:right;font-size:13px;color:#6b7280;font-weight:600;">Subtotal</th>
                </tr>
              </thead>
              <tbody>%s</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:10px 0;text-align:right;font-weight:700;color:#111827;">Total estimado:</td>
                  <td style="padding:10px 0;text-align:right;font-weight:700;color:#2563eb;font-size:16px;">$%s</td>
                </tr>
              </tfoot>
            </table>
            El cliente puede contactarte directamente por WhatsApp.
            """.formatted(vendorName, catalogName, customerName, rows, String.format("%,.0f", total));

        String catalogUrl = baseUrl + "/c/" + catalogId;
        String html = buildActionEmail("Nueva solicitud de pedido", body, catalogUrl, "Ver catálogo →",
                fromName() + " — Notificación de pedido");
        send(toEmail, "ORDER", "Nueva solicitud — " + catalogName, html);
    }

    // ── HTML builder ──────────────────────────────────────────────────────────

    private String buildActionEmail(String heading, String body, String ctaUrl, String ctaText, String footer) {
        String color = primaryColor();
        String cta = ctaUrl != null ? """
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr>
              <td style="background:%s;border-radius:10px;">
                <a href="%s" style="display:block;padding:13px 28px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;">%s</a>
              </td>
            </tr></table>""".formatted(color, ctaUrl, ctaText) : "";

        return """
            <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f5f3ff;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="padding:48px 20px;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%%;">
                    <tr><td style="text-align:center;padding-bottom:20px;">
                      <span style="font-size:22px;font-weight:700;color:%s;">%s</span>
                    </td></tr>
                    <tr><td style="background:#fff;border-radius:20px;padding:44px 48px;box-shadow:0 2px 20px rgba(99,102,241,0.10);">
                      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1e1b4b;">%s</h1>
                      <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;">%s</p>
                      %s
                      <p style="margin:0;font-size:12px;color:#9ca3af;">%s</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body></html>
            """.formatted(color, fromName(), heading, body, cta, footer);
    }
}
