package com.jafpsoft.ventas.dto.billing;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IssueInvoiceRequest {

    @NotNull
    private Long saleTicketId;

    /** UUID generado en frontend antes de enviar — garantiza idempotencia */
    @NotNull
    private String correlationId;

    /** 80=CUIT, 96=DNI, 99=Consumidor Final */
    private Integer docTipo;

    /** Número de documento del receptor (0 si es consumidor final) */
    private Long docNro;

    /** 1=Productos, 2=Servicios, 3=Ambos */
    private Integer concepto;

    /** Id de alícuota IVA: 3=0%, 4=10.5%, 5=21%, 6=27%. Solo aplica a FA/FB. */
    private Integer alicIvaId;
}
