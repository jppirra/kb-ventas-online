package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.order.OrderRequestPayload;
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
    public void sendCatalogPausedEmail(String toEmail, String vendorName, String catalogName, long reportCount) {
        String body = """
            Hola <strong>%s</strong>,<br><br>
            Tu catálogo <strong>"%s"</strong> ha recibido <strong>%d denuncias</strong> de usuarios y ha sido pausado automáticamente para revisión.<br><br>
            Nuestro equipo revisará el contenido y te contactará a la brevedad. Si considerás que fue un error, podés responder este email para iniciar el proceso de apelación.<br><br>
            Mientras tanto, el catálogo no será visible para el público.
            """.formatted(vendorName, catalogName, reportCount);
        String html = buildActionEmail(
                "Tu catálogo fue pausado",
                body, null, null,
                FROM_NAME + " — Notificación de moderación");
        send(toEmail, "Catálogo pausado: " + catalogName, html);
    }

    @Async
    public void sendAdminEmail(String toEmail, String subject, String body) {
        String html = buildActionEmail(subject, body, null, null, FROM_NAME + " — Admin");
        send(toEmail, subject, html);
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
        String html = buildActionEmail(
                "Nueva solicitud de pedido",
                body,
                catalogUrl, "Ver catálogo →",
                FROM_NAME + " — Notificación de pedido");

        send(toEmail, "Nueva solicitud — " + catalogName, html);
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

