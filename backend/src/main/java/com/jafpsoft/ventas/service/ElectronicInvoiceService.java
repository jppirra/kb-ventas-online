package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.billing.*;
import com.jafpsoft.ventas.exception.AfipException;
import com.jafpsoft.ventas.exception.AfipUnavailableException;
import com.jafpsoft.ventas.integration.afip.*;
import com.jafpsoft.ventas.model.*;
import com.jafpsoft.ventas.model.BillingAuditLog.LogStatus;
import com.jafpsoft.ventas.model.InvoiceRecord.InvoiceStatus;
import com.jafpsoft.ventas.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.KeyStore;
import java.security.cert.X509Certificate;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

/**
 * Servicio de facturación electrónica.
 * Orquesta: certificado → WSAA → WSFE → registro + auditoría.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ElectronicInvoiceService {

    private static final DateTimeFormatter CBTE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final String AFIP_QR_BASE = "https://www.afip.gob.ar/fe/qr/?p=";

    private final TicketConfigRepository   configRepo;
    private final InvoiceRecordRepository  invoiceRepo;
    private final BillingAuditLogRepository auditRepo;
    private final SaleTicketRepository     ticketRepo;
    private final WsaaClient               wsaaClient;
    private final WsfeClient               wsfeClient;
    private final AfipTokenCache           tokenCache;
    private final AfipQrGenerator          qrGenerator;

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURACIÓN FISCAL
    // ═══════════════════════════════════════════════════════════════════════════

    public FiscalConfigResponse getConfig(Long userId) {
        TicketConfig cfg = configOrNew(userId);
        return FiscalConfigResponse.from(cfg);
    }

    @Transactional
    public FiscalConfigResponse updateConfig(Long userId, FiscalConfigRequest req) {
        TicketConfig cfg = configOrNew(userId);
        if (req.getAfipEnabled() != null)  cfg.setAfipEnabled(req.getAfipEnabled());
        if (req.getAfipAmbiente() != null) cfg.setAfipAmbiente(req.getAfipAmbiente());
        cfg = java.util.Objects.requireNonNull(configRepo.save(cfg));
        // Al cambiar ambiente se invalida el token cacheado
        tokenCache.evict(userId);
        return FiscalConfigResponse.from(cfg);
    }

    @Transactional
    public FiscalConfigResponse uploadCertificate(Long userId, MultipartFile file, String password) {
        TicketConfig cfg = configOrNew(userId);
        try {
            byte[] bytes = file.getBytes();
            String b64 = Base64.getEncoder().encodeToString(bytes);

            // Validar que el .p12 es válido con la contraseña dada
            KeyStore ks = KeyStore.getInstance("PKCS12");
            ks.load(new ByteArrayInputStream(bytes), password.toCharArray());

            String alias = ks.aliases().nextElement();
            X509Certificate cert = (X509Certificate) ks.getCertificate(alias);
            LocalDate expiry = cert.getNotAfter().toInstant()
                    .atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            String subject = cert.getSubjectX500Principal().getName();

            cfg.setAfipCertP12(b64);
            cfg.setAfipCertPassword(password);
            cfg.setAfipCertExpiry(expiry);
            cfg.setAfipCertSubject(subject);
            cfg.setAfipCertNotifiedExpiry(false);
            configRepo.save(cfg);
            tokenCache.evict(userId);

            audit(userId, "CERT_UPLOAD", LogStatus.SUCCESS,
                    cfg.getAfipAmbiente(), null, null, "subject=" + subject + " expiry=" + expiry);
            log.info("Certificado AFIP cargado userId={} subject={} expiry={}", userId, subject, expiry);
            return FiscalConfigResponse.from(cfg);

        } catch (AfipException | AfipUnavailableException e) {
            throw e;
        } catch (Exception e) {
            audit(userId, "CERT_UPLOAD", LogStatus.FAILURE, null, null, e.getMessage(), null);
            throw new AfipException("El certificado no es válido o la contraseña es incorrecta: " + e.getMessage(), e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST DE CONEXIÓN
    // ═══════════════════════════════════════════════════════════════════════════

    public TestConnectionResponse testConnection(Long userId) {
        long t0 = System.currentTimeMillis();
        TicketConfig cfg = configOrNew(userId);
        String ambiente = cfg.getAfipAmbiente() != null ? cfg.getAfipAmbiente() : "HOMOLOGACION";

        if (!cfg.isAfipEnabled() || cfg.getAfipCertP12() == null) {
            return TestConnectionResponse.builder()
                    .success(false).ambiente(ambiente)
                    .message("AFIP no habilitado o certificado no cargado").build();
        }
        try {
            tokenCache.evict(userId);   // forzar autenticación fresca
            getOrRefreshToken(userId, cfg);
            long ms = System.currentTimeMillis() - t0;
            audit(userId, "TEST_CONNECTION", LogStatus.SUCCESS, ambiente, ms, null, null);
            return TestConnectionResponse.builder()
                    .success(true).ambiente(ambiente)
                    .message("Conexión exitosa con WSAA de AFIP")
                    .cuitCertificado(cfg.getTaxId())
                    .certExpiry(cfg.getAfipCertExpiry())
                    .durationMs(ms).build();
        } catch (Exception e) {
            long ms = System.currentTimeMillis() - t0;
            audit(userId, "TEST_CONNECTION", LogStatus.FAILURE, ambiente, ms, e.getMessage(), null);
            return TestConnectionResponse.builder()
                    .success(false).ambiente(ambiente)
                    .message("Error: " + e.getMessage())
                    .durationMs(ms).build();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EMISIÓN DE COMPROBANTE
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public InvoiceRecordResponse issueInvoice(Long userId, IssueInvoiceRequest req) {
        String correlationId = req.getCorrelationId();
        MDC.put("correlationId", correlationId);
        long t0 = System.currentTimeMillis();

        // Idempotencia: si ya existe un comprobante autorizado para este correlationId, devolverlo
        Optional<InvoiceRecord> existing = invoiceRepo.findByCorrelationId(correlationId);
        if (existing.isPresent()) {
            InvoiceRecord ex = existing.get();
            if (ex.getStatus() == InvoiceStatus.AUTHORIZED) {
                log.info("[{}] Comprobante ya autorizado, devolviendo caché", correlationId);
                return InvoiceRecordResponse.from(ex, AFIP_QR_BASE);
            }
        }

        TicketConfig cfg = configOrNew(userId);
        validateConfig(cfg);

        Long ticketId = java.util.Objects.requireNonNull(req.getSaleTicketId(), "saleTicketId requerido");
        SaleTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new AfipException("Ticket no encontrado: " + ticketId));
        if (!ticket.getUserId().equals(userId)) throw new AfipException("Acceso denegado al ticket");

        String ambiente = cfg.getAfipAmbiente();
        String cuit     = cfg.getTaxId().replaceAll("[^0-9]", "");
        int tipoCbte    = resolveTipoCbte(cfg.getTipoComprobante());
        int puntoVenta  = cfg.getPuntoVenta();
        int docTipo     = req.getDocTipo()  != null ? req.getDocTipo()  : 99;  // CF por defecto
        long docNro     = req.getDocNro()   != null ? req.getDocNro()   : 0L;
        int concepto    = req.getConcepto() != null ? req.getConcepto() : 1;   // Productos
        int alicIvaId   = req.getAlicIvaId() != null ? req.getAlicIvaId() : 5; // 21% por defecto

        BigDecimal total = ticket.getTotal();
        BigDecimal impNeto, impIva;

        // Factura C (Monotributo): no hay IVA discriminado
        boolean esMonotributo = tipoCbte == 11;
        if (esMonotributo) {
            impNeto = total.setScale(2, RoundingMode.HALF_UP);
            impIva  = BigDecimal.ZERO;
        } else {
            // RI: el total ya incluye IVA
            BigDecimal divisor = alicIvaMultiplier(alicIvaId);
            impNeto = total.divide(divisor, 2, RoundingMode.HALF_UP);
            impIva  = total.subtract(impNeto).setScale(2, RoundingMode.HALF_UP);
        }

        // ── Autenticar con WSAA ──────────────────────────────────────────────
        AfipTokenHolder token;
        try {
            token = getOrRefreshToken(userId, cfg);
        } catch (Exception e) {
            audit(userId, "WSAA_AUTH", LogStatus.FAILURE, ambiente,
                    System.currentTimeMillis() - t0, e.getMessage(), correlationId);
            throw e;
        }

        // ── Próximo número de comprobante ────────────────────────────────────
        long ultimoNro = wsfeClient.ultimoAutorizado(
                token.getToken(), token.getSign(), cuit, puntoVenta, tipoCbte, ambiente);
        long nroCbte = ultimoNro + 1;

        // ── Solicitar CAE ────────────────────────────────────────────────────
        WsfeClient.WsfeRequest wsfeReq = new WsfeClient.WsfeRequest(
                token.getToken(), token.getSign(), cuit,
                puntoVenta, tipoCbte,
                concepto, docTipo, docNro,
                nroCbte, LocalDate.now().format(CBTE_FMT),
                total, impNeto, impIva, alicIvaId,
                ambiente
        );

        WsfeClient.WsfeResult result = wsfeClient.solicitarCae(wsfeReq);

        // ── Persistir ────────────────────────────────────────────────────────
        InvoiceStatus status = result.autorizado() ? InvoiceStatus.AUTHORIZED : InvoiceStatus.REJECTED;

        InvoiceRecord inv = InvoiceRecord.builder()
                .userId(userId)
                .saleTicketId(ticketId)
                .correlationId(correlationId)
                .tipoCbte(tipoCbte)
                .puntoVenta(puntoVenta)
                .nroCbte(result.nroCbte())
                .cuitEmisor(cuit)
                .docTipo(docTipo)
                .docNro(docNro)
                .concepto(concepto)
                .cbteFecha(LocalDate.now().format(CBTE_FMT))
                .impTotal(total)
                .impNeto(impNeto)
                .impIva(impIva)
                .alicIvaId(alicIvaId)
                .cae(result.cae())
                .caeExpiry(result.caeExpiry())
                .status(status)
                .afipResultCode(result.afipCode())
                .afipResultMsg(result.afipMsg())
                .xmlRequest(result.xmlRequest())
                .xmlResponse(result.xmlResponse())
                .ambiente(ambiente)
                .build();

        inv = java.util.Objects.requireNonNull(invoiceRepo.save(inv));

        // Generar y guardar QR AFIP si fue autorizado
        if (status == InvoiceStatus.AUTHORIZED) {
            String qrB64 = qrGenerator.generateBase64Json(inv);
            inv.setQrData(qrB64);
            inv = java.util.Objects.requireNonNull(invoiceRepo.save(inv));
        }

        long ms = System.currentTimeMillis() - t0;
        LogStatus logStatus = status == InvoiceStatus.AUTHORIZED ? LogStatus.SUCCESS : LogStatus.FAILURE;
        audit(userId, "WSFE_ISSUE", logStatus, ambiente, ms,
                status == InvoiceStatus.AUTHORIZED ? null : result.afipMsg(), correlationId);

        log.info("[{}] Comprobante {} tipoCbte={} nro={} CAE={} en {}ms",
                correlationId, status, tipoCbte, nroCbte, result.cae(), ms);

        return InvoiceRecordResponse.from(inv, AFIP_QR_BASE);
    }

    // ── Historial ────────────────────────────────────────────────────────────

    public List<InvoiceRecordResponse> getInvoices(Long userId) {
        return invoiceRepo.findByUserIdOrderByRequestedAtDesc(userId).stream()
                .map(r -> InvoiceRecordResponse.from(r, AFIP_QR_BASE))
                .toList();
    }

    public Optional<InvoiceRecordResponse> getByTicket(Long userId, Long ticketId) {
        return invoiceRepo.findBySaleTicketId(ticketId)
                .filter(r -> r.getUserId().equals(userId))
                .map(r -> InvoiceRecordResponse.from(r, AFIP_QR_BASE));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS PRIVADOS
    // ═══════════════════════════════════════════════════════════════════════════

    private AfipTokenHolder getOrRefreshToken(Long userId, TicketConfig cfg) {
        return tokenCache.get(userId).orElseGet(() -> {
            AfipTokenHolder h = wsaaClient.authenticate(
                    cfg.getAfipCertP12(), cfg.getAfipCertPassword(), cfg.getAfipAmbiente());
            tokenCache.put(userId, h);
            return h;
        });
    }

    private TicketConfig configOrNew(Long userId) {
        Long uid = java.util.Objects.requireNonNull(userId);
        return configRepo.findById(uid)
                .orElse(TicketConfig.builder().userId(uid).build());
    }

    private void validateConfig(TicketConfig cfg) {
        if (!cfg.isAfipEnabled())
            throw new AfipException("La facturación electrónica no está habilitada");
        if (cfg.getAfipCertP12() == null)
            throw new AfipException("No hay certificado digital cargado");
        if (cfg.getTaxId() == null || cfg.getTaxId().isBlank())
            throw new AfipException("CUIT no configurado");
        if (cfg.getPuntoVenta() == null)
            throw new AfipException("Punto de venta no configurado");
    }

    /** tipoCbte según condición IVA del vendedor */
    private int resolveTipoCbte(String tipo) {
        if (tipo == null) return 6;
        return switch (tipo.toUpperCase()) {
            case "A" -> 1;   // Factura A
            case "C" -> 11;  // Factura C (Monotributo)
            default  -> 6;   // Factura B
        };
    }

    /** Divisor para separar neto+IVA del total con IVA incluido */
    private BigDecimal alicIvaMultiplier(int alicIvaId) {
        return switch (alicIvaId) {
            case 4 -> new BigDecimal("1.105");  // 10.5%
            case 6 -> new BigDecimal("1.27");   // 27%
            default -> new BigDecimal("1.21");  // 21%
        };
    }

    private void audit(Long userId, String op, LogStatus status,
                       String ambiente, Long ms, String error, String correlationId) {
        try {
            BillingAuditLog entry = BillingAuditLog.builder()
                    .userId(userId).correlationId(correlationId)
                    .operation(op).status(status).ambiente(ambiente)
                    .durationMs(ms).errorMessage(error).build();
            java.util.Objects.requireNonNull(auditRepo.save(entry));
        } catch (Exception e) {
            log.error("Error guardando audit log: {}", e.getMessage());
        }
    }
}
