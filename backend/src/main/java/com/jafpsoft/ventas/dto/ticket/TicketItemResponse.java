package com.jafpsoft.ventas.dto.ticket;

import com.jafpsoft.ventas.model.SaleTicketItem;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TicketItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private String size;
    private String color;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private Integer sortOrder;

    public static TicketItemResponse from(SaleTicketItem i) {
        TicketItemResponse r = new TicketItemResponse();
        r.id = i.getId();
        r.productId = i.getProductId();
        r.productName = i.getProductName();
        r.productSku = i.getProductSku();
        r.size = i.getSize();
        r.color = i.getColor();
        r.quantity = i.getQuantity();
        r.unitPrice = i.getUnitPrice();
        r.subtotal = i.getSubtotal();
        r.sortOrder = i.getSortOrder();
        return r;
    }
}
