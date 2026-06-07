package com.jafpsoft.ventas.dto.order;

import com.jafpsoft.ventas.model.OrderRequest;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrderResponse {
    private Long id;
    private Long catalogId;
    private String catalogName;
    private String customerName;
    private String customerPhone;
    private String vendorNotes;
    private String itemsJson;
    private BigDecimal total;
    private String status;
    private LocalDateTime createdAt;

    public static OrderResponse from(OrderRequest o) {
        OrderResponse r = new OrderResponse();
        r.id = o.getId();
        r.catalogId = o.getCatalogId();
        r.catalogName = o.getCatalogName();
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
