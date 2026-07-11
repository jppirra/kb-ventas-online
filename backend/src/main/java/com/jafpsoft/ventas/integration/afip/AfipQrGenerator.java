package com.jafpsoft.ventas.integration.afip;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.model.InvoiceRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Genera el QR AFIP según especificación oficial.
 * Formato: https://www.afip.gob.ar/fe/qr/?p={base64url_json}
 *
 * JSON requerido:
 * { ver, fecha, cuit, ptoVta, tipoCmp, nroCmp, importe,
 *   moneda, ctz, tipoDocRec, nroDocRec, tipoCodAut, codAut }
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AfipQrGenerator {

    private static final String BASE_URL = "https://www.afip.gob.ar/fe/qr/?p=";
    private static final DateTimeFormatter QR_DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private final ObjectMapper objectMapper;

    /**
     * Genera la URL completa del QR para incluir en el PDF del comprobante.
     */
    public String generateUrl(InvoiceRecord inv) {
        try {
            String json = buildJson(inv);
            String b64 = Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes());
            return BASE_URL + b64;
        } catch (Exception e) {
            log.error("Error generando QR AFIP para invoiceId={}: {}", inv.getId(), e.getMessage());
            return null;
        }
    }

    /**
     * Genera y devuelve únicamente el JSON base64 para almacenar en la BD.
     */
    public String generateBase64Json(InvoiceRecord inv) {
        try {
            String json = buildJson(inv);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes());
        } catch (Exception e) {
            log.error("Error generando QR-JSON AFIP: {}", e.getMessage());
            return null;
        }
    }

    private String buildJson(InvoiceRecord inv) throws Exception {
        // AFIP exige que importe sea número entero en centavos...
        // en realidad la especificación usa el importe en la moneda (con decimales)
        double importe = inv.getImpTotal() != null
                ? inv.getImpTotal().doubleValue()
                : 0.0;

        String fecha = inv.getRequestedAt() != null
                ? inv.getRequestedAt().toLocalDate().format(QR_DATE_FMT)
                : java.time.LocalDate.now().format(QR_DATE_FMT);

        Map<String, Object> qr = new LinkedHashMap<>();
        qr.put("ver", 1);
        qr.put("fecha", fecha);
        qr.put("cuit", Long.parseLong(inv.getCuitEmisor() != null ? inv.getCuitEmisor() : "0"));
        qr.put("ptoVta", inv.getPuntoVenta());
        qr.put("tipoCmp", inv.getTipoCbte());
        qr.put("nroCmp", inv.getNroCbte());
        qr.put("importe", importe);
        qr.put("moneda", inv.getMoneda() != null ? inv.getMoneda() : "PES");
        qr.put("ctz", 1);
        qr.put("tipoDocRec", inv.getDocTipo() != null ? inv.getDocTipo() : 99);
        qr.put("nroDocRec", inv.getDocNro() != null ? inv.getDocNro() : 0L);
        qr.put("tipoCodAut", "E");   // E = CAE
        qr.put("codAut", Long.parseLong(inv.getCae() != null ? inv.getCae() : "0"));

        return objectMapper.writeValueAsString(qr);
    }
}
