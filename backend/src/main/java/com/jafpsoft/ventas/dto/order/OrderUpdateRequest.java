package com.jafpsoft.ventas.dto.order;

import lombok.Data;

@Data
public class OrderUpdateRequest {
    private String customerName;
    private String customerPhone;
    private String vendorNotes;
    private String status;
}
