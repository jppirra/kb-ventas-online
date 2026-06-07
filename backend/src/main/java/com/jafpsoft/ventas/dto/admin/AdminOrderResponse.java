package com.jafpsoft.ventas.dto.admin;

import com.jafpsoft.ventas.model.OrderRequest;
import com.jafpsoft.ventas.model.User;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AdminOrderResponse {
    private Long id;
    private String catalogName;
    private String vendorName;
    private String vendorEmail;
    private String customerName;
    private String customerPhone;
    private String vendorNotes;
    private String itemsJson;
    private BigDecimal total;
    private String status;
    private LocalDateTime createdAt;

    public static AdminOrderResponse from(OrderRequest o, User vendor) {
        AdminOrderResponse r = new AdminOrderResponse();
        r.id = o.getId();
        r.catalogName = o.getCatalogName();
        r.vendorName = vendor != null ? vendor.getName() : "Desconocido";
        r.vendorEmail = vendor != null ? vendor.getEmail() : null;
        r.customerName = o.getCustomerName();
        r.customerPhone = o.getCustomerPhone();
        r.vendorNotes = o.getVendorNotes();
        r.itemsJson = o.getItemsJson();
        r.total = o.getTotal();
        r.status = o.getStatus();
        r.createdAt = o.getCreatedAt();
        return r;
    }
}
