package com.jafpsoft.ventas.exception;

public class MercadoPagoTokenException extends MercadoPagoException {
    public MercadoPagoTokenException(String message) {
        super(message);
    }

    public MercadoPagoTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
