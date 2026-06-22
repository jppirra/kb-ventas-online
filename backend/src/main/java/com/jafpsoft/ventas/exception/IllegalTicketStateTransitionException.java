package com.jafpsoft.ventas.exception;

public class IllegalTicketStateTransitionException extends RuntimeException {
    public IllegalTicketStateTransitionException(String from, String to) {
        super("Transición de estado inválida: " + from + " → " + to);
    }
}
