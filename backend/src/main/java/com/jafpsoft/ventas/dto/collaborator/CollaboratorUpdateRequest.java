package com.jafpsoft.ventas.dto.collaborator;

import lombok.Data;

import java.util.List;

@Data
public class CollaboratorUpdateRequest {
    private boolean accessAllCatalogs = false;
    private List<Long> catalogIds;
    private boolean canPublish = false;
}
