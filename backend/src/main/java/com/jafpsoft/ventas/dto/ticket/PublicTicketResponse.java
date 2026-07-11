package com.jafpsoft.ventas.dto.ticket;

import com.jafpsoft.ventas.model.SaleTicket;
import com.jafpsoft.ventas.model.TicketConfig;
import com.jafpsoft.ventas.model.User;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PublicTicketResponse {

    @Data
    public static class TicketData {
        private String ticketNumber;
        private String tipoDoc;
        private String referenceTicketNumber;
        private String customerName;
        private String customerDni;
        private String customerPhone;
        private String customerEmail;
        private String customerNotes;
        private BigDecimal subtotal;
        private BigDecimal discount;
        private BigDecimal total;
        private String paymentMethod;
        private String status;
        private String cancellationReason;
        private String notes;
        private List<TicketItemResponse> items;
        private LocalDateTime createdAt;
    }

    @Data
    public static class ConfigData {
        private String businessName;
        private String businessAddress;
        private String businessPhone;
        private String businessEmail;
        private String taxId;
        private String currency;
        private String logoUrl;
        private String footer;
        private boolean showCatalogQr;
        private String catalogSlug;
        private Integer puntoVenta;
        private String tipoComprobante;
        private String condicionIva;
        private String ingresosBrutos;
        private String inicioActividades;
    }

    private TicketData ticket;
    private ConfigData config;

    public static PublicTicketResponse from(SaleTicket t, TicketConfig c, User vendor) {
        PublicTicketResponse r = new PublicTicketResponse();

        TicketData td = new TicketData();
        td.ticketNumber = t.getTicketNumber();
        td.tipoDoc = t.getTipoDoc() != null ? t.getTipoDoc() : "COMP";
        td.referenceTicketNumber = t.getReferenceTicketNumber();
        td.customerName = t.getCustomerName();
        td.customerDni = t.getCustomerDni();
        td.customerPhone = t.getCustomerPhone();
        td.customerEmail = t.getCustomerEmail();
        td.customerNotes = t.getCustomerNotes();
        td.subtotal = t.getSubtotal();
        td.discount = t.getDiscount();
        td.total = t.getTotal();
        td.paymentMethod = t.getPaymentMethod();
        td.status = t.getStatus();
        td.cancellationReason = t.getCancellationReason();
        td.notes = t.getNotes();
        td.createdAt = t.getCreatedAt();
        td.items = t.getItems().stream()
                .sorted((a, b) -> Integer.compare(
                        a.getSortOrder() != null ? a.getSortOrder() : 0,
                        b.getSortOrder() != null ? b.getSortOrder() : 0))
                .map(TicketItemResponse::from)
                .toList();
        r.ticket = td;

        ConfigData cd = new ConfigData();
        if (c != null) {
            cd.businessName = c.getBusinessName();
            cd.businessAddress = c.getBusinessAddress();
            cd.businessPhone = c.getBusinessPhone();
            cd.businessEmail = c.getBusinessEmail();
            cd.taxId = c.getTaxId();
            cd.currency = c.getCurrency() != null ? c.getCurrency() : "$";
            cd.logoUrl = c.getLogoUrl();
            cd.footer = c.getFooter();
            cd.showCatalogQr = c.isShowCatalogQr();
            cd.puntoVenta = c.getPuntoVenta();
            cd.tipoComprobante = c.getTipoComprobante() != null ? c.getTipoComprobante() : "B";
            cd.condicionIva = c.getCondicionIva();
            cd.ingresosBrutos = c.getIngresosBrutos();
            cd.inicioActividades = c.getInicioActividades();
        } else {
            cd.currency = "$";
            cd.tipoComprobante = "B";
        }
        if (vendor != null) {
            cd.catalogSlug = vendor.getSlug();
        }
        r.config = cd;

        return r;
    }
}
