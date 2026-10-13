package com.jafpsoft.ventas.hallazgos;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jafpsoft.ventas.dto.collaborator.CollaboratorInviteRequest;
import com.jafpsoft.ventas.dto.collaborator.CollaboratorUpdateRequest;
import com.jafpsoft.ventas.model.Catalog;
import com.jafpsoft.ventas.model.CatalogCollaborator;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.CatalogCollaboratorRepository;
import com.jafpsoft.ventas.repository.CatalogRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import com.jafpsoft.ventas.service.CollaboratorService;
import com.jafpsoft.ventas.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * SEC-003: un colaborador solo puede recibir acceso a catálogos del vendedor que lo invita.
 */
@Tag("hallazgo")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SEC003Test {

    private static final Long DUENO = 1L;
    private static final Long COLABORADOR = 2L;
    private static final Long OTRO_VENDEDOR = 3L;
    private static final Long CATALOGO_PROPIO = 10L;
    private static final Long CATALOGO_AJENO = 99L;

    @Mock private CatalogCollaboratorRepository collaboratorRepository;
    @Mock private CatalogRepository catalogRepository;
    @Mock private UserRepository userRepository;
    @Mock private EmailService emailService;

    private CollaboratorService service;

    @BeforeEach
    void setUp() {
        service = new CollaboratorService(collaboratorRepository, catalogRepository, userRepository,
                emailService, new ObjectMapper());

        Catalog propio = Catalog.builder().id(CATALOGO_PROPIO).userId(DUENO).name("Propio").build();
        Catalog ajeno = Catalog.builder().id(CATALOGO_AJENO).userId(OTRO_VENDEDOR).name("Ajeno").build();
        when(catalogRepository.findById(CATALOGO_PROPIO)).thenReturn(Optional.of(propio));
        when(catalogRepository.findById(CATALOGO_AJENO)).thenReturn(Optional.of(ajeno));
        when(catalogRepository.findByIdAndUserId(CATALOGO_PROPIO, DUENO)).thenReturn(Optional.of(propio));
        when(catalogRepository.findByIdAndUserId(CATALOGO_AJENO, DUENO)).thenReturn(Optional.empty());

        when(userRepository.findById(DUENO)).thenReturn(Optional.of(
                User.builder().id(DUENO).name("Dueña").email("duena@example.com").build()));
    }

    @Test
    void invitar_descartaLosCatalogosQueNoSonDelQueInvita() {
        when(collaboratorRepository.findByCollaboratorEmailAndOwnerId(any(), any())).thenReturn(Optional.empty());

        CollaboratorInviteRequest req = new CollaboratorInviteRequest();
        req.setEmail("colaborador@example.com");
        req.setCatalogIds(List.of(CATALOGO_PROPIO, CATALOGO_AJENO));

        service.invite(req, DUENO);

        assertEquals("[10]", guardado().getCatalogIds());
    }

    @Test
    void reinvitar_descartaLosCatalogosQueNoSonDelQueInvita() {
        CatalogCollaborator revocado = CatalogCollaborator.builder()
                .id(5L).ownerId(DUENO).collaboratorEmail("colaborador@example.com").status("REVOKED").build();
        when(collaboratorRepository.findByCollaboratorEmailAndOwnerId(any(), any())).thenReturn(Optional.of(revocado));

        CollaboratorInviteRequest req = new CollaboratorInviteRequest();
        req.setEmail("colaborador@example.com");
        req.setCatalogIds(List.of(CATALOGO_AJENO));

        service.invite(req, DUENO);

        assertNull(guardado().getCatalogIds());
    }

    @Test
    void actualizar_descartaLosCatalogosQueNoSonDelDueno() {
        CatalogCollaborator existente = CatalogCollaborator.builder()
                .id(5L).ownerId(DUENO).collaboratorEmail("colaborador@example.com")
                .collaboratorUserId(COLABORADOR).status("ACTIVE").build();
        when(collaboratorRepository.findByIdAndOwnerId(5L, DUENO)).thenReturn(Optional.of(existente));

        CollaboratorUpdateRequest req = new CollaboratorUpdateRequest();
        req.setCatalogIds(List.of(CATALOGO_PROPIO, CATALOGO_AJENO));

        service.update(5L, req, DUENO);

        assertEquals("[10]", guardado().getCatalogIds());
    }

    @Test
    void unaListaYaGuardadaConUnCatalogoAjeno_noDaAcceso() {
        when(collaboratorRepository.findByCollaboratorUserIdAndStatus(COLABORADOR, "ACTIVE")).thenReturn(List.of(
                CatalogCollaborator.builder().id(5L).ownerId(DUENO).collaboratorUserId(COLABORADOR)
                        .status("ACTIVE").catalogIds("[10,99]").build()));

        assertFalse(service.hasAccessToCatalog(CATALOGO_AJENO, COLABORADOR));
        assertEquals(List.of(CATALOGO_PROPIO), service.getAccessibleCatalogIds(COLABORADOR));
    }

    @Test
    void elCatalogoDelDueno_sigueDandoAcceso() {
        when(collaboratorRepository.findByCollaboratorUserIdAndStatus(COLABORADOR, "ACTIVE")).thenReturn(List.of(
                CatalogCollaborator.builder().id(5L).ownerId(DUENO).collaboratorUserId(COLABORADOR)
                        .status("ACTIVE").catalogIds("[10]").build()));

        assertTrue(service.hasAccessToCatalog(CATALOGO_PROPIO, COLABORADOR));
    }

    private CatalogCollaborator guardado() {
        ArgumentCaptor<CatalogCollaborator> captor = ArgumentCaptor.forClass(CatalogCollaborator.class);
        verify(collaboratorRepository).save(captor.capture());
        return captor.getValue();
    }
}
