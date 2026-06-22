package com.jafpsoft.ventas.exception;

import lombok.Getter;

@Getter
public class WebhookSignatureException extends MercadoPagoException {

    private final String reason;

    public WebhookSignatureException(String reason) {
        super("Webhook signature invalid: " + reason);
        this.reason = reason;
    }
}
