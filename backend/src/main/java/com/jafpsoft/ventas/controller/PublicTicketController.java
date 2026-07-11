package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.ticket.PublicTicketResponse;
import com.jafpsoft.ventas.model.SaleTicket;
import com.jafpsoft.ventas.model.TicketConfig;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.SaleTicketRepository;
import com.jafpsoft.ventas.repository.TicketConfigRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/public/tickets")
@RequiredArgsConstructor
public class PublicTicketController {

    private final SaleTicketRepository ticketRepository;
    private final TicketConfigRepository configRepository;
    private final UserRepository userRepository;

    @GetMapping("/{token}")
    public PublicTicketResponse getByToken(@PathVariable String token) {
        SaleTicket ticket = ticketRepository.findByPublicToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comprobante no encontrado"));
        TicketConfig config = configRepository.findById(ticket.getUserId()).orElse(null);
        User vendor = userRepository.findById(ticket.getUserId()).orElse(null);
        return PublicTicketResponse.from(ticket, config, vendor);
    }
}
