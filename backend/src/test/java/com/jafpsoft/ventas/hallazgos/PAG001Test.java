package com.jafpsoft.ventas.hallazgos;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.integration.mercadopago.MercadoPagoApiClient;
import com.jafpsoft.ventas.integration.mercadopago.MercadoPagoTokenManager;
import com.jafpsoft.ventas.integration.mercadopago.MercadoPagoWebhookProcessor;
import com.jafpsoft.ventas.model.SaleTicket;
import com.jafpsoft.ventas.repository.MercadoPagoPaymentLogRepository;
import com.jafpsoft.ventas.repository.MercadoPagoWebhookEventRepository;
import com.jafpsoft.ventas.repository.ProductRepository;
import com.jafpsoft.ventas.repository.SaleTicketRepository;
import com.jafpsoft.ventas.repository.TicketConfigRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import com.jafpsoft.ventas.service.EmailService;
import com.jafpsoft.ventas.service.MercadoPagoPaymentService;
import com.jafpsoft.ventas.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * PAG-001: un pago aprobado solo confirma un ticket del vendedor que lo cobró y por el total del ticket.
 */
@Tag("hallazgo")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PAG001Test {

    private static final Long VENDEDOR = 1L;
    private static final Long OTRO_VENDEDOR = 2L;
    private static final Long TICKET = 5L;
    private static final Long EVENTO = 7L;
    private static final String PAGO = "123456";

    @Mock private SaleTicketRepository ticketRepository;
    @Mock private TicketConfigRepository configRepository;
    @Mock private ProductRepository productRepository;
    @Mock private MercadoPagoPaymentLogRepository paymentLogRepository;
    @Mock private MercadoPagoApiClient apiClient;
    @Mock private MercadoPagoTokenManager tokenManager;
    @Mock private EmailService emailService;
    @Mock private NotificationService notificationService;
    @Mock private UserRepository userRepository;
    @Mock private MercadoPagoWebhookEventRepository webhookEventRepository;

    private MercadoPagoWebhookProcessor processor;

    @BeforeEach
    void setUp() {
        MercadoPagoPaymentService paymentService = new MercadoPagoPaymentService(
                ticketRepository, configRepository, productRepository, paymentLogRepository,
                apiClient, tokenManager, emailService, notificationService, userRepository);
        processor = new MercadoPagoWebhookProcessor(paymentService, apiClient, tokenManager, webhookEventRepository);
        when(tokenManager.getValidToken(VENDEDOR)).thenReturn("token-del-vendedor");
    }

    @Test
    void unPagoDelVendedor_noConfirmaElTicketDeOtroVendedor() throws Exception {
        SaleTicket ajeno = ticketPendiente(OTRO_VENDEDOR, "1000.00");
        pagoAprobado("1000.00");

        processor.processAsync(EVENTO, "payment", PAGO, VENDEDOR, "corr");

        assertEquals("PAYMENT_PENDING", ajeno.getStatus());
        verify(webhookEventRepository).updateStatus(eq(EVENTO), eq("failed"), any());
        verify(webhookEventRepository, never()).markProcessed(any(), any());
    }

    @Test
    void unPagoPorMenosDelTotal_noConfirmaElTicket() throws Exception {
        SaleTicket ticket = ticketPendiente(VENDEDOR, "1000.00");
        pagoAprobado("1.00");

        processor.processAsync(EVENTO, "payment", PAGO, VENDEDOR, "corr");

        assertEquals("PAYMENT_PENDING", ticket.getStatus());
        verify(webhookEventRepository).updateStatus(eq(EVENTO), eq("failed"), any());
    }

    @Test
    void unPagoSinImporte_noConfirmaElTicket() throws Exception {
        SaleTicket ticket = ticketPendiente(VENDEDOR, "1000.00");
        pagoAprobado(null);

        processor.processAsync(EVENTO, "payment", PAGO, VENDEDOR, "corr");

        assertEquals("PAYMENT_PENDING", ticket.getStatus());
    }

    @Test
    void unPagoPropioPorElTotal_confirmaElTicket() throws Exception {
        SaleTicket ticket = ticketPendiente(VENDEDOR, "1000.00");
        pagoAprobado("1000");

        processor.processAsync(EVENTO, "payment", PAGO, VENDEDOR, "corr");

        assertEquals("PAID", ticket.getStatus());
        assertEquals(PAGO, ticket.getMpPaymentId());
        verify(webhookEventRepository).markProcessed(eq(EVENTO), any());
    }

    private SaleTicket ticketPendiente(Long dueno, String total) {
        SaleTicket ticket = SaleTicket.builder()
                .id(TICKET).userId(dueno).ticketNumber("T-0005")
                .status("PAYMENT_PENDING").total(new BigDecimal(total))
                .build();
        when(ticketRepository.findById(TICKET)).thenReturn(Optional.of(ticket));
        when(ticketRepository.findByIdAndUserId(TICKET, dueno)).thenReturn(Optional.of(ticket));
        return ticket;
    }

    private void pagoAprobado(String importe) throws Exception {
        String json = "{\"status\":\"approved\",\"status_detail\":\"accredited\","
                + "\"external_reference\":\"ticket:" + TICKET + "\","
                + (importe != null ? "\"transaction_amount\":" + importe + "," : "")
                + "\"date_approved\":\"2026-10-12T10:00:00.000-04:00\"}";
        JsonNode payment = new ObjectMapper().readTree(json);
        when(apiClient.getPayment("token-del-vendedor", PAGO)).thenReturn(payment);
    }
}
