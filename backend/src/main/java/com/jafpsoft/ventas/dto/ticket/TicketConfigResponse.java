package com.jafpsoft.ventas.dto.ticket;

import com.jafpsoft.ventas.model.TicketConfig;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TicketConfigResponse {
    private String businessName;
    private String businessAddress;
    private String businessPhone;
    private String businessEmail;
    private String taxId;
    private String logoUrl;
    private String currency;
    private String paymentMethods;
    private String bankAccounts;
    private String footer;
    private boolean showCatalogQr;
    private Integer nextTicketNumber;
    private String tipoComprobante;
    private Integer puntoVenta;
    private String condicionIva;
    private String ingresosBrutos;
    private String inicioActividades;
    private String catalogSlug;
    private String countryCode;
    // Mercado Pago — solo campos públicos (nunca tokens)
    private boolean mpEnabled;
    private Long mpUserId;
    private String mpPublicKey;
    private LocalDateTime mpConnectedAt;

    public static TicketConfigResponse from(TicketConfig c) {
        TicketConfigResponse r = new TicketConfigResponse();
        r.businessName = c.getBusinessName();
        r.businessAddress = c.getBusinessAddress();
        r.businessPhone = c.getBusinessPhone();
        r.businessEmail = c.getBusinessEmail();
        r.taxId = c.getTaxId();
        r.logoUrl = c.getLogoUrl();
        r.currency = c.getCurrency() != null ? c.getCurrency() : "$";
        r.paymentMethods = c.getPaymentMethods();
        r.bankAccounts = c.getBankAccounts();
        r.footer = c.getFooter();
        r.showCatalogQr = c.isShowCatalogQr();
        r.nextTicketNumber = c.getNextTicketNumber();
        r.tipoComprobante = c.getTipoComprobante() != null ? c.getTipoComprobante() : "B";
        r.puntoVenta = c.getPuntoVenta();
        r.condicionIva = c.getCondicionIva();
        r.ingresosBrutos = c.getIngresosBrutos();
        r.inicioActividades = c.getInicioActividades();
        r.mpEnabled = c.isMpEnabled();
        r.mpUserId = c.getMpUserId();
        r.mpPublicKey = c.getMpPublicKey();
        r.mpConnectedAt = c.getMpConnectedAt();
        return r;
    }
}
