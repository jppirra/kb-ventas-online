package com.jafpsoft.ventas.exception;

public class MercadoPagoUnavailableException extends MercadoPagoException {
    public MercadoPagoUnavailableException(String message) {
        super(message);
    }

    public MercadoPagoUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
