package com.jafpsoft.ventas.exception;

import com.jafpsoft.ventas.security.crypto.CryptoOperationException;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException e) {
        return error(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas.");
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, String>> handleDisabled(DisabledException e) {
        return error(HttpStatus.FORBIDDEN, "Tu cuenta está deshabilitada.");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthentication(AuthenticationException e) {
        return error(HttpStatus.UNAUTHORIZED, "Error de autenticación.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException e) {
        return error(HttpStatus.FORBIDDEN, "No tenés permisos para realizar esta acción.");
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleEntityNotFound(EntityNotFoundException e) {
        return error(HttpStatus.NOT_FOUND, e.getMessage() != null ? e.getMessage() : "Recurso no encontrado.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return error(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException e) {
        String msg = e.getReason() != null ? e.getReason() : "Error en la solicitud.";
        return error(HttpStatus.valueOf(e.getStatusCode().value()), msg);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return error(HttpStatus.BAD_REQUEST, msg.isBlank() ? "Los datos enviados no son válidos." : msg);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleUnreadable(HttpMessageNotReadableException e) {
        return error(HttpStatus.BAD_REQUEST, "El cuerpo de la solicitud no es válido.");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, String>> handleMissingParam(MissingServletRequestParameterException e) {
        return error(HttpStatus.BAD_REQUEST, "Falta el parámetro: " + e.getParameterName());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoResourceFoundException e) {
        return error(HttpStatus.NOT_FOUND, "El recurso solicitado no existe.");
    }

    @ExceptionHandler(MercadoPagoUnavailableException.class)
    public ResponseEntity<Map<String, String>> handleMpUnavailable(MercadoPagoUnavailableException e) {
        log.warn("MP unavailable: {}", e.getMessage());
        return error(HttpStatus.SERVICE_UNAVAILABLE,
                "Mercado Pago no está disponible en este momento. Intentá en unos minutos.");
    }

    @ExceptionHandler(MercadoPagoApiException.class)
    public ResponseEntity<Map<String, String>> handleMpApi(MercadoPagoApiException e) {
        log.warn("MP API error {}: {}", e.getHttpStatus(), e.getMessage());
        HttpStatus status = e.isClientError() ? HttpStatus.BAD_REQUEST : HttpStatus.BAD_GATEWAY;
        return error(status, "Error al comunicarse con Mercado Pago. Si el problema persiste, contactá soporte.");
    }

    @ExceptionHandler(MercadoPagoTokenException.class)
    public ResponseEntity<Map<String, String>> handleMpToken(MercadoPagoTokenException e) {
        log.warn("MP token error: {}", e.getMessage());
        return error(HttpStatus.FAILED_DEPENDENCY,
                "Tu cuenta de Mercado Pago no está conectada o el acceso fue revocado. Reconectala en Configuración.");
    }

    @ExceptionHandler(WebhookSignatureException.class)
    public ResponseEntity<Map<String, String>> handleWebhookSignature(WebhookSignatureException e) {
        log.warn("Webhook signature rejected [{}]", e.getReason());
        return error(HttpStatus.UNAUTHORIZED, "Solicitud no autorizada.");
    }

    @ExceptionHandler(IllegalTicketStateTransitionException.class)
    public ResponseEntity<Map<String, String>> handleTicketTransition(IllegalTicketStateTransitionException e) {
        return error(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(CryptoOperationException.class)
    public ResponseEntity<Map<String, String>> handleCrypto(CryptoOperationException e) {
        log.error("CRITICAL: Crypto operation failed — possible data tampering: {}", e.getMessage(), e);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error inesperado. Intentá nuevamente.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception e) {
        log.error("Unhandled exception [{}]: {}", e.getClass().getSimpleName(), e.getMessage(), e);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error inesperado. Intentá nuevamente.");
    }

    private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}

