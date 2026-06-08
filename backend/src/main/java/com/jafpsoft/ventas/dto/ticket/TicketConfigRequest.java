package com.jafpsoft.ventas.dto.ticket;

import lombok.Data;

@Data
public class TicketConfigRequest {
    private String businessName;
    private String businessAddress;
    private String businessPhone;
    private String businessEmail;
    private String taxId;
    private String logoUrl;
    private String currency;
    private String paymentMethods;
    private String footer;
    private Boolean showCatalogQr;
}
