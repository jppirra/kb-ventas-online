package com.jafpsoft.ventas.dto.ticket;

import com.jafpsoft.ventas.model.TicketConfig;
import lombok.Data;

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
    private String footer;
    private boolean showCatalogQr;
    private Integer nextTicketNumber;
    private String tipoComprobante;
    private Integer puntoVenta;
    private String condicionIva;
    private String ingresosBrutos;
    private String inicioActividades;

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
        r.footer = c.getFooter();
        r.showCatalogQr = c.isShowCatalogQr();
        r.nextTicketNumber = c.getNextTicketNumber();
        r.tipoComprobante = c.getTipoComprobante() != null ? c.getTipoComprobante() : "B";
        r.puntoVenta = c.getPuntoVenta();
        r.condicionIva = c.getCondicionIva();
        r.ingresosBrutos = c.getIngresosBrutos();
        r.inicioActividades = c.getInicioActividades();
        return r;
    }
}
