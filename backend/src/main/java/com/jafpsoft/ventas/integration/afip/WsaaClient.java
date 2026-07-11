package com.jafpsoft.ventas.integration.afip;

import com.jafpsoft.ventas.exception.AfipException;
import com.jafpsoft.ventas.exception.AfipUnavailableException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.cert.jcajce.JcaCertStore;
import org.bouncycastle.cms.*;
import org.bouncycastle.cms.jcajce.*;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.operator.jcajce.JcaDigestCalculatorProviderBuilder;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.Document;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Collections;

@Slf4j
@Component
@RequiredArgsConstructor
public class WsaaClient {

    private static final String WSAA_HOMO = "https://wsaahomo.afip.gov.ar/ws/services/LoginCms";
    private static final String WSAA_PROD = "https://wsaa.afip.gov.ar/ws/services/LoginCms";
    private static final DateTimeFormatter AFIP_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX")
                    .withZone(ZoneId.of("America/Argentina/Buenos_Aires"));

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${afip.wsaa.homo:" + WSAA_HOMO + "}")
    private String wsaaHomoUrl;

    @Value("${afip.wsaa.prod:" + WSAA_PROD + "}")
    private String wsaaProdUrl;

    @CircuitBreaker(name = "afip-wsaa", fallbackMethod = "authFallback")
    public AfipTokenHolder authenticate(String certP12B64, String certPassword, String ambiente) {
        long t0 = System.currentTimeMillis();
        String correlationId = MDC.get("correlationId");
        log.info("[{}] WSAA authenticate ambiente={}", correlationId, ambiente);
        try {
            byte[] p12Bytes = Base64.getDecoder().decode(certP12B64);
            KeyStore ks = KeyStore.getInstance("PKCS12");
            ks.load(new ByteArrayInputStream(p12Bytes), certPassword.toCharArray());

            String alias = ks.aliases().nextElement();
            PrivateKey privateKey = (PrivateKey) ks.getKey(alias, certPassword.toCharArray());
            X509Certificate cert = (X509Certificate) ks.getCertificate(alias);

            String tra = buildTra();
            byte[] cms = signWithCms(tra.getBytes(StandardCharsets.UTF_8), privateKey, cert);
            String cmsB64 = Base64.getEncoder().encodeToString(cms);

            String url = "PRODUCCION".equalsIgnoreCase(ambiente) ? wsaaProdUrl : wsaaHomoUrl;
            String response = callSoap(url, buildSoapRequest(cmsB64));

            AfipTokenHolder holder = parseResponse(response);
            log.info("[{}] WSAA OK en {}ms expira={}", correlationId,
                    System.currentTimeMillis() - t0, holder.getExpiresAt());
            return holder;

        } catch (AfipUnavailableException e) {
            throw e;
        } catch (Exception e) {
            log.error("[{}] WSAA error: {}", correlationId, e.getMessage(), e);
            throw new AfipException("Error de autenticación WSAA: " + e.getMessage(), e);
        }
    }

    // ── Construcción del TRA ────────────────────────────────────────────────────

    private String buildTra() {
        Instant now = Instant.now();
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <loginTicketRequest version="1.0">
                  <header>
                    <uniqueId>%d</uniqueId>
                    <generationTime>%s</generationTime>
                    <expirationTime>%s</expirationTime>
                  </header>
                  <service>wsfe</service>
                </loginTicketRequest>
                """.formatted(
                now.getEpochSecond(),
                AFIP_FMT.format(now.minusSeconds(600)),
                AFIP_FMT.format(now.plusSeconds(600))
        );
    }

    /** Firma el TRA con CMS (PKCS#7 detached) usando BouncyCastle */
    private byte[] signWithCms(byte[] data, PrivateKey key, X509Certificate cert) throws Exception {
        CMSSignedDataGenerator gen = new CMSSignedDataGenerator();
        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
                .setProvider("BC").build(key);
        gen.addSignerInfoGenerator(
                new JcaSignerInfoGeneratorBuilder(
                        new JcaDigestCalculatorProviderBuilder().setProvider("BC").build()
                ).build(signer, cert));
        gen.addCertificates(new JcaCertStore(Collections.singletonList(cert)));
        return gen.generate(new CMSProcessableByteArray(data), false).getEncoded();
    }

    private String buildSoapRequest(String cmsB64) {
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                                  xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
                  <soapenv:Header/>
                  <soapenv:Body>
                    <wsaa:loginCms>
                      <wsaa:in0>%s</wsaa:in0>
                    </wsaa:loginCms>
                  </soapenv:Body>
                </soapenv:Envelope>
                """.formatted(cmsB64);
    }

    // ── SOAP HTTP ───────────────────────────────────────────────────────────────

    private String callSoap(String url, String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_XML);
        headers.set("SOAPAction", "\"\"");
        try {
            String result = restTemplate.postForObject(url, new HttpEntity<>(body, headers), String.class);
            if (result == null) throw new AfipUnavailableException("WSAA devolvió respuesta vacía");
            return result;
        } catch (AfipUnavailableException e) {
            throw e;
        } catch (RestClientException e) {
            throw new AfipUnavailableException("WSAA no disponible: " + e.getMessage(), e);
        }
    }

    // ── Parseo respuesta WSAA ────────────────────────────────────────────────────

    private AfipTokenHolder parseResponse(String xml) throws Exception {
        // El loginCmsReturn contiene el XML de respuesta como texto (posiblemente CDATA)
        // Extraemos token y sign usando el DOM parser
        String inner = extractTagContent(xml, "loginCmsReturn");
        if (inner == null) inner = xml;

        // El inner es XML del loginTicketResponse
        Document doc = DocumentBuilderFactory.newDefaultInstance()
                .newDocumentBuilder()
                .parse(new ByteArrayInputStream(inner.getBytes(StandardCharsets.UTF_8)));

        String token = doc.getElementsByTagName("token").item(0).getTextContent();
        String sign  = doc.getElementsByTagName("sign").item(0).getTextContent();
        String expStr = doc.getElementsByTagName("expirationTime").item(0).getTextContent();

        Instant expiresAt = Instant.from(AFIP_FMT.parse(expStr));

        return AfipTokenHolder.builder()
                .token(token)
                .sign(sign)
                .expiresAt(expiresAt)
                .build();
    }

    /** Extrae el contenido de un tag de primer nivel en el XML */
    private String extractTagContent(String xml, String tag) {
        int start = xml.indexOf("<" + tag + ">");
        int end   = xml.indexOf("</" + tag + ">");
        if (start < 0 || end < 0) return null;
        String content = xml.substring(start + tag.length() + 2, end).trim();
        // quitar CDATA si lo hubiera
        if (content.startsWith("<![CDATA[")) {
            content = content.substring(9, content.length() - 3);
        }
        return content;
    }

    // ── Fallback Circuit Breaker ────────────────────────────────────────────────

    @SuppressWarnings("unused")
    private AfipTokenHolder authFallback(String certP12B64, String certPassword,
                                          String ambiente, Throwable t) {
        log.warn("AFIP-WSAA circuit breaker abierto: {}", t.getMessage());
        throw new AfipUnavailableException("El servicio de autenticación de AFIP no está disponible. Reintentá en unos minutos.", t);
    }
}
