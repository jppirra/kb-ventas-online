package com.jafpsoft.ventas.dto.payment;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MercadoPagoPreferenceResponse {
    private String preferenceId;
    private String initPoint;
    private String sandboxInitPoint;
}
