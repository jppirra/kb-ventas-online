package com.jafpsoft.ventas.dto.payment;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MercadoPagoPaymentStatusResponse {
    private String ticketStatus;
    private String mpStatus;
    private String mpStatusDetail;
    private String mpPaymentId;
    private String mpPreferenceId;
}
