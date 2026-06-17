package com.jafpsoft.ventas.dto.contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactRequest {
    @NotBlank @Size(max = 100)
    private String name;
    @NotBlank @Email @Size(max = 150)
    private String email;
    @NotBlank @Size(max = 200)
    private String subject;
    @NotBlank
    private String message;
}
