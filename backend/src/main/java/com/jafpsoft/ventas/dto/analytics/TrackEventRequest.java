package com.jafpsoft.ventas.dto.analytics;

import lombok.Data;

@Data
public class TrackEventRequest {
    private String eventType;
    private String page;
    private String sessionId;
    private Long durationMs;
    private String browser;
    private String browserVersion;
    private String os;
    private String deviceType;
    private String metadata;
}
