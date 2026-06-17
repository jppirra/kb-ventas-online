package com.jafpsoft.ventas.dto.admin;

import com.jafpsoft.ventas.model.ModerationLog;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ModerationLogResponse {
    private Long id;
    private String targetType;
    private Long targetId;
    private String targetName;
    private String action;
    private String reason;
    private Long adminId;
    private String adminName;
    private LocalDateTime createdAt;

    public static ModerationLogResponse from(ModerationLog log) {
        ModerationLogResponse r = new ModerationLogResponse();
        r.id = log.getId();
        r.targetType = log.getTargetType();
        r.targetId = log.getTargetId();
        r.targetName = log.getTargetName();
        r.action = log.getAction();
        r.reason = log.getReason();
        r.adminId = log.getAdminId();
        r.adminName = log.getAdminName();
        r.createdAt = log.getCreatedAt();
        return r;
    }
}
