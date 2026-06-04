package com.jafpsoft.ventas.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminEmailRequest {
    @Email @NotBlank
    private String to;
    @NotBlank
    private String subject;
    @NotBlank
    private String body;
}
