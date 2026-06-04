package com.jafpsoft.ventas.dto.profile;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BioGenerationRequest {
    @NotBlank
    private String rubro;           // ej: "indumentaria femenina", "electrónica"
    @NotBlank
    private String productTypes;    // ej: "remeras, vestidos, accesorios"
    @NotBlank
    private String tone;            // PROFESIONAL | CERCANO | CREATIVO
}
