package com.jafpsoft.ventas.dto.customer;

import lombok.Data;

@Data
public class CustomerRequest {
    private String name;
    private String phone;
    private String email;
    private String notes;
    private String source;
    private Long orderId;
}
