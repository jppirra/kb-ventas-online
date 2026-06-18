package com.jafpsoft.ventas.dto.admin;

import lombok.Data;

@Data
public class AdminUpdateProfileRequest {
    private String name;
    private String slug;
    private String bio;
    private String whatsappNumber;
    private String brandColorPrimary;
    private String brandColorSecondary;
}
