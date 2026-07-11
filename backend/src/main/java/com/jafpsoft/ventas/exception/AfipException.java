package com.jafpsoft.ventas.exception;

public class AfipException extends RuntimeException {
    private final Integer afipCode;

    public AfipException(String message) {
        super(message);
        this.afipCode = null;
    }

    public AfipException(String message, Throwable cause) {
        super(message, cause);
        this.afipCode = null;
    }

    public AfipException(String message, Integer afipCode) {
        super(message);
        this.afipCode = afipCode;
    }

    public Integer getAfipCode() { return afipCode; }
}
