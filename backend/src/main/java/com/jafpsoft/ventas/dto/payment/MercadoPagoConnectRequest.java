package com.jafpsoft.ventas.dto.payment;

import lombok.Data;

@Data
public class MercadoPagoConnectRequest {
    private String code;
    private String state;
}
