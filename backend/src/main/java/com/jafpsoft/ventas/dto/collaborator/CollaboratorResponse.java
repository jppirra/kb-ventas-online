package com.jafpsoft.ventas.dto.collaborator;

import com.jafpsoft.ventas.model.CatalogCollaborator;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CollaboratorResponse {
    private Long id;
    private String collaboratorEmail;
    private String collaboratorName;
    private String collaboratorProfileImageUrl;
    private Long collaboratorUserId;
    private String status;
    private boolean accessAllCatalogs;
    private List<Long> catalogIds;
    private List<String> catalogNames;
    private boolean canPublish;
    private LocalDateTime createdAt;

    public static CollaboratorResponse from(CatalogCollaborator c) {
        CollaboratorResponse r = new CollaboratorResponse();
        r.id = c.getId();
        r.collaboratorEmail = c.getCollaboratorEmail();
        r.collaboratorUserId = c.getCollaboratorUserId();
        r.status = c.getStatus();
        r.accessAllCatalogs = c.isAccessAllCatalogs();
        r.canPublish = c.isCanPublish();
        r.createdAt = c.getCreatedAt();
        return r;
    }
}
