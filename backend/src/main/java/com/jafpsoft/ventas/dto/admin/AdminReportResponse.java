package com.jafpsoft.ventas.dto.admin;

import com.jafpsoft.ventas.model.CatalogReport;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminReportResponse {
    private Long id;
    private Long catalogId;
    private String catalogName;
    private String vendorName;
    private String vendorEmail;
    private String reason;
    private String details;
    private long totalReportsForCatalog;
    private LocalDateTime createdAt;

    public static AdminReportResponse from(CatalogReport r, String catalogName, String vendorName, String vendorEmail, long total) {
        AdminReportResponse resp = new AdminReportResponse();
        resp.id = r.getId();
        resp.catalogId = r.getCatalogId();
        resp.catalogName = catalogName;
        resp.vendorName = vendorName;
        resp.vendorEmail = vendorEmail;
        resp.reason = r.getReason();
        resp.details = r.getDetails();
        resp.totalReportsForCatalog = total;
        resp.createdAt = r.getCreatedAt();
        return resp;
    }
}
