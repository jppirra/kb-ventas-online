package com.jafpsoft.ventas.exception;

import lombok.Getter;

@Getter
public class MercadoPagoApiException extends MercadoPagoException {

    private final int httpStatus;
    private final String mpErrorCode;

    public MercadoPagoApiException(int httpStatus, String message, String mpErrorCode) {
        super(message);
        this.httpStatus = httpStatus;
        this.mpErrorCode = mpErrorCode;
    }

    public boolean isClientError() {
        return httpStatus >= 400 && httpStatus < 500;
    }
}
