package com.jafpsoft.ventas.integration.afip;

import com.jafpsoft.ventas.exception.AfipUnavailableException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Cliente para el Web Service de Factura Electrónica (WSFE) de AFIP.
 * Documentación: https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WsfeClient {

    private static final String WSFE_HOMO = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx";
    private static final String WSFE_PROD = "https://servicios1.afip.gov.ar/wsfev1/service.asmx";
    private static final String NS = "http://ar.gov.afip.dif.FEV1/";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${afip.wsfe.homo:" + WSFE_HOMO + "}")
    private String wsfeHomoUrl;

    @Value("${afip.wsfe.prod:" + WSFE_PROD + "}")
    private String wsfeProdUrl;

    // ── Último comprobante autorizado ────────────────────────────────────────────

    @CircuitBreaker(name = "afip-wsfe", fallbackMethod = "wsfeUltimoFallback")
    public long ultimoAutorizado(String token, String sign, String cuit,
                                  int puntoVenta, int tipoCbte, String ambiente) {
        String correlationId = MDC.get("correlationId");
        log.info("[{}] WSFE FECompUltimoAutorizado ptoVta={} tipo={}", correlationId, puntoVenta, tipoCbte);

        String soap = """
                <?xml version="1.0" encoding="UTF-8"?>
                <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                                  xmlns:ar="%s">
                  <soapenv:Header/>
                  <soapenv:Body>
                    <ar:FECompUltimoAutorizado>
                      <ar:Auth>
                        <ar:Token>%s</ar:Token>
                        <ar:Sign>%s</ar:Sign>
                        <ar:Cuit>%s</ar:Cuit>
                      </ar:Auth>
                      <ar:PtoVta>%d</ar:PtoVta>
                      <ar:CbteTipo>%d</ar:CbteTipo>
                    </ar:FECompUltimoAutorizado>
                  </soapenv:Body>
                </soapenv:Envelope>
                """.formatted(NS, token, sign, cuit, puntoVenta, tipoCbte);

        String resp = callSoap(ambienteUrl(ambiente), soap,
                "http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado");
        String nroStr = extractTag(resp, "CbteNro");
        if (nroStr == null) return 0L;
        return Long.parseLong(nroStr.trim());
    }

    // ── Solicitar CAE (comprobante) ─────────────────────────────────────────────

    @CircuitBreaker(name = "afip-wsfe", fallbackMethod = "wsfeSolicitarFallback")
    public WsfeResult solicitarCae(WsfeRequest req) {
        String correlationId = MDC.get("correlationId");
        log.info("[{}] WSFE FECAESolicitar tipo={} nro={}", correlationId, req.tipoCbte(), req.nroCbte());

        String ivaSection = buildIvaSection(req);
        String cbteFecha = req.cbteFecha() != null
                ? req.cbteFecha()
                : LocalDate.now().format(DATE_FMT);

        String soap = """
                <?xml version="1.0" encoding="UTF-8"?>
                <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                                  xmlns:ar="%s">
                  <soapenv:Header/>
                  <soapenv:Body>
                    <ar:FECAESolicitar>
                      <ar:Auth>
                        <ar:Token>%s</ar:Token>
                        <ar:Sign>%s</ar:Sign>
                        <ar:Cuit>%s</ar:Cuit>
                      </ar:Auth>
                      <ar:FeCAEReq>
                        <ar:FeCabReq>
                          <ar:CantReg>1</ar:CantReg>
                          <ar:PtoVta>%d</ar:PtoVta>
                          <ar:CbteTipo>%d</ar:CbteTipo>
                        </ar:FeCabReq>
                        <ar:FeDetReq>
                          <ar:FECAEDetRequest>
                            <ar:Concepto>%d</ar:Concepto>
                            <ar:DocTipo>%d</ar:DocTipo>
                            <ar:DocNro>%d</ar:DocNro>
                            <ar:CbteDesde>%d</ar:CbteDesde>
                            <ar:CbteHasta>%d</ar:CbteHasta>
                            <ar:CbteFch>%s</ar:CbteFch>
                            <ar:ImpTotal>%s</ar:ImpTotal>
                            <ar:ImpTotConc>0.00</ar:ImpTotConc>
                            <ar:ImpNeto>%s</ar:ImpNeto>
                            <ar:ImpOpEx>0.00</ar:ImpOpEx>
                            <ar:ImpIVA>%s</ar:ImpIVA>
                            <ar:ImpTrib>0.00</ar:ImpTrib>
                            <ar:MonId>PES</ar:MonId>
                            <ar:MonCotiz>1</ar:MonCotiz>
                            %s
                          </ar:FECAEDetRequest>
                        </ar:FeDetReq>
                      </ar:FeCAEReq>
                    </ar:FECAESolicitar>
                  </soapenv:Body>
                </soapenv:Envelope>
                """.formatted(NS,
                req.token(), req.sign(), req.cuit(),
                req.puntoVenta(), req.tipoCbte(),
                req.concepto(), req.docTipo(), req.docNro(),
                req.nroCbte(), req.nroCbte(),
                cbteFecha,
                fmt(req.impTotal()), fmt(req.impNeto()), fmt(req.impIva()),
                ivaSection);

        String resp = callSoap(ambienteUrl(req.ambiente()), soap,
                "http://ar.gov.afip.dif.FEV1/FECAESolicitar");

        return parseResult(resp, req.nroCbte(), soap, resp);
    }

    // ── Construcción auxiliar ────────────────────────────────────────────────────

    /**
     * IVA section solo para Factura A y B.
     * Factura C (tipo 11/12/13) no lleva IVA.
     */
    private String buildIvaSection(WsfeRequest req) {
        boolean esMonotributo = req.tipoCbte() == 11 || req.tipoCbte() == 12 || req.tipoCbte() == 13;
        if (esMonotributo || req.impIva().compareTo(BigDecimal.ZERO) == 0) return "";

        return """
                <ar:Iva>
                  <ar:AlicIva>
                    <ar:Id>%d</ar:Id>
                    <ar:BaseImp>%s</ar:BaseImp>
                    <ar:Importe>%s</ar:Importe>
                  </ar:AlicIva>
                </ar:Iva>
                """.formatted(req.alicIvaId(), fmt(req.impNeto()), fmt(req.impIva()));
    }

    private String fmt(BigDecimal v) {
        return (v == null ? BigDecimal.ZERO : v).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String ambienteUrl(String ambiente) {
        return "PRODUCCION".equalsIgnoreCase(ambiente) ? wsfeProdUrl : wsfeHomoUrl;
    }

    // ── SOAP HTTP ────────────────────────────────────────────────────────────────

    private String callSoap(String url, String body, String soapAction) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_XML);
        headers.set("SOAPAction", "\"" + soapAction + "\"");
        try {
            String result = restTemplate.postForObject(url, new HttpEntity<>(body, headers), String.class);
            if (result == null) throw new AfipUnavailableException("WSFE devolvió respuesta vacía");
            return result;
        } catch (AfipUnavailableException e) {
            throw e;
        } catch (RestClientException e) {
            throw new AfipUnavailableException("WSFE no disponible: " + e.getMessage(), e);
        }
    }

    // ── Parseo resultado ─────────────────────────────────────────────────────────

    private WsfeResult parseResult(String xml, long nroCbte, String xmlReq, String xmlResp) {
        String resultado = extractTag(xml, "Resultado");
        String cae      = extractTag(xml, "CAE");
        String caeFch   = extractTag(xml, "CAEFchVto");
        String obs       = extractTag(xml, "Msg");
        String errCode   = extractTag(xml, "Code");

        boolean autorizado = "A".equals(resultado);

        LocalDate caeExpiry = null;
        if (caeFch != null && !caeFch.isBlank()) {
            String caeFchClean = caeFch.trim();
            caeExpiry = LocalDate.parse(caeFchClean, DATE_FMT);
        }

        Integer code = null;
        if (errCode != null && !errCode.isBlank()) {
            try { code = Integer.parseInt(errCode.trim()); } catch (NumberFormatException ignore) {}
        }

        if (!autorizado) {
            log.warn("WSFE rechazó comprobante nro={} obs={}", nroCbte, obs);
        }

        return new WsfeResult(autorizado, cae, caeExpiry, code, obs, nroCbte, xmlReq, xmlResp);
    }

    private String extractTag(String xml, String tag) {
        int start = xml.indexOf("<" + tag + ">");
        int end   = xml.indexOf("</" + tag + ">");
        if (start < 0 || end < 0) return null;
        return xml.substring(start + tag.length() + 2, end);
    }

    // ── Fallbacks Circuit Breaker ────────────────────────────────────────────────

    @SuppressWarnings("unused")
    private long wsfeUltimoFallback(String t, String s, String c, int pv, int tc, String a, Throwable ex) {
        throw new AfipUnavailableException("WSFE no disponible (último autorizado): " + ex.getMessage(), ex);
    }

    @SuppressWarnings("unused")
    private WsfeResult wsfeSolicitarFallback(WsfeRequest req, Throwable ex) {
        throw new AfipUnavailableException("WSFE no disponible (solicitar CAE): " + ex.getMessage(), ex);
    }

    // ── Value objects ─────────────────────────────────────────────────────────────

    public record WsfeRequest(
            String token, String sign, String cuit,
            int puntoVenta, int tipoCbte,
            int concepto, int docTipo, long docNro,
            long nroCbte, String cbteFecha,
            BigDecimal impTotal, BigDecimal impNeto, BigDecimal impIva,
            int alicIvaId,
            String ambiente
    ) {}

    public record WsfeResult(
            boolean autorizado,
            String cae,
            LocalDate caeExpiry,
            Integer afipCode,
            String afipMsg,
            long nroCbte,
            String xmlRequest,
            String xmlResponse
    ) {}
}
