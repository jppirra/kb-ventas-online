package com.jafpsoft.ventas.dto.customer;

import com.jafpsoft.ventas.model.Customer;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CustomerResponse {
    private Long id;
    private String name;
    private String dni;
    private String phone;
    private String email;
    private String notes;
    private String source;
    private Long orderId;
    private LocalDateTime createdAt;

    public static CustomerResponse from(Customer c) {
        return CustomerResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .dni(c.getDni())
                .phone(c.getPhone())
                .email(c.getEmail())
                .notes(c.getNotes())
                .source(c.getSource())
                .orderId(c.getOrderId())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
