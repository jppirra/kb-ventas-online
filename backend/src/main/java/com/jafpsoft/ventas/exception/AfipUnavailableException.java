package com.jafpsoft.ventas.exception;

/** Señal para el Circuit Breaker — se lanza cuando AFIP no responde o devuelve 5xx */
public class AfipUnavailableException extends RuntimeException {
    public AfipUnavailableException(String message) { super(message); }
    public AfipUnavailableException(String message, Throwable cause) { super(message, cause); }
}
