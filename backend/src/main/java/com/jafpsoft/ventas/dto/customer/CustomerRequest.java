package com.jafpsoft.ventas.dto.customer;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerRequest {
    @NotBlank(message = "El nombre es obligatorio")
    private String name;
    private String dni;
    private String phone;
    private String email;
    private String notes;
    private String source;
    private Long orderId;
}
