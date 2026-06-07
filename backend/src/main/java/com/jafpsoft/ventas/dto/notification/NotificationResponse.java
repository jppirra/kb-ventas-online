package com.jafpsoft.ventas.dto.notification;

import com.jafpsoft.ventas.model.Notification;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String message;
    private Long referenceId;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.id = n.getId();
        r.type = n.getType();
        r.title = n.getTitle();
        r.message = n.getMessage();
        r.referenceId = n.getReferenceId();
        r.read = n.isRead();
        r.createdAt = n.getCreatedAt();
        return r;
    }
}
