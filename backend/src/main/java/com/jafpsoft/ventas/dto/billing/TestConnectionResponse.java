package com.jafpsoft.ventas.dto.billing;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class TestConnectionResponse {
    private boolean success;
    private String  ambiente;
    private String  message;
    private String  cuitCertificado;
    private LocalDate certExpiry;
    private Long    durationMs;
    private String  wsaaVersion;
}
