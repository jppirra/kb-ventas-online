package com.jafpsoft.ventas.dto.billing;

import com.jafpsoft.ventas.model.TicketConfig;
import lombok.Data;

import java.time.LocalDate;

@Data
public class FiscalConfigResponse {
    private boolean afipEnabled;
    private String  afipAmbiente;
    private boolean certLoaded;
    private String  certSubject;
    private LocalDate certExpiry;
    private boolean certExpiringSoon;  // verdad si vence en ≤30 días
    // datos fiscales ya existentes
    private String cuit;
    private Integer puntoVenta;
    private String condicionIva;
    private String tipoComprobante;
    private String ingresosBrutos;
    private String inicioActividades;

    public static FiscalConfigResponse from(TicketConfig c) {
        FiscalConfigResponse r = new FiscalConfigResponse();
        r.afipEnabled     = c.isAfipEnabled();
        r.afipAmbiente    = c.getAfipAmbiente() != null ? c.getAfipAmbiente() : "HOMOLOGACION";
        r.certLoaded      = c.getAfipCertP12() != null && !c.getAfipCertP12().isBlank();
        r.certSubject     = c.getAfipCertSubject();
        r.certExpiry      = c.getAfipCertExpiry();
        r.certExpiringSoon = c.getAfipCertExpiry() != null
                && c.getAfipCertExpiry().isBefore(LocalDate.now().plusDays(30));
        r.cuit             = c.getTaxId();
        r.puntoVenta       = c.getPuntoVenta();
        r.condicionIva     = c.getCondicionIva();
        r.tipoComprobante  = c.getTipoComprobante();
        r.ingresosBrutos   = c.getIngresosBrutos();
        r.inicioActividades = c.getInicioActividades();
        return r;
    }
}
