package com.jafpsoft.ventas.dto.settings;

import lombok.Data;

@Data
public class StockReportConfigRequest {
    private String frequency; // frecuencia: NONE, DAILY, WEEKLY, MONTHLY
    private Integer dayOfWeek;  // 1=lunes … 7=domingo
    private Integer dayOfMonth; // 1-28
}
