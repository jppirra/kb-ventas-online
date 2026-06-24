package com.jafpsoft.ventas.dto.billing;

import lombok.Data;

@Data
public class FiscalConfigRequest {
    private Boolean afipEnabled;
    private String  afipAmbiente;   // "HOMOLOGACION" | "PRODUCCION"
}
