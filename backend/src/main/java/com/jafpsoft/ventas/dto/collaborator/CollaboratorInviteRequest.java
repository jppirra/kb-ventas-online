package com.jafpsoft.ventas.dto.collaborator;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CollaboratorInviteRequest {
    @NotBlank @Email
    private String email;
    private boolean accessAllCatalogs = false;
    private List<Long> catalogIds;
    private boolean canPublish = false;
}
