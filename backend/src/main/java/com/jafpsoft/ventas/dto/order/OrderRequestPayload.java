package com.jafpsoft.ventas.dto.order;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderRequestPayload {
    private String customerName;
    private List<Item> items;

    @Data
    public static class Item {
        private Long productId;
        private String productName;
        private BigDecimal price;
        private BigDecimal offerPrice;
        private Integer quantity;
    }
}
