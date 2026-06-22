package com.jafpsoft.ventas.dto.payment;

import com.jafpsoft.ventas.model.TicketConfig;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MercadoPagoConnectResponse {
    private boolean mpEnabled;
    private Long mpUserId;
    private String mpPublicKey;
    private LocalDateTime mpConnectedAt;

    public static MercadoPagoConnectResponse from(TicketConfig config) {
        return MercadoPagoConnectResponse.builder()
                .mpEnabled(config.isMpEnabled())
                .mpUserId(config.getMpUserId())
                .mpPublicKey(config.getMpPublicKey())
                .mpConnectedAt(config.getMpConnectedAt())
                .build();
    }

    public static MercadoPagoConnectResponse disconnected() {
        return MercadoPagoConnectResponse.builder()
                .mpEnabled(false)
                .build();
    }
}
