package com.jafpsoft.ventas.dto.store;

import com.jafpsoft.ventas.dto.profile.PublicCatalogResponse;
import com.jafpsoft.ventas.model.Store;
import lombok.Data;
import java.util.List;

@Data
public class PublicStoreResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String logoUrl;
    private String whatsappNumber;
    private List<PublicCatalogResponse> catalogs;

    public static PublicStoreResponse from(Store s) {
        PublicStoreResponse r = new PublicStoreResponse();
        r.id = s.getId();
        r.name = s.getName();
        r.slug = s.getSlug();
        r.description = s.getDescription();
        r.logoUrl = s.getLogoUrl();
        r.whatsappNumber = s.getWhatsappNumber();
        return r;
    }
}
