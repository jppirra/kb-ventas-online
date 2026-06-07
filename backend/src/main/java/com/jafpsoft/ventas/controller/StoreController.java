package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.store.StoreRequest;
import com.jafpsoft.ventas.dto.store.StoreResponse;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @GetMapping
    public List<StoreResponse> list(@AuthenticationPrincipal CustomUserDetails user) {
        return storeService.listByUser(uid(user));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StoreResponse create(@Valid @RequestBody StoreRequest req,
                                @AuthenticationPrincipal CustomUserDetails user) {
        return storeService.create(req, uid(user));
    }

    @PutMapping("/{id}")
    public StoreResponse update(@PathVariable Long id,
                                @Valid @RequestBody StoreRequest req,
                                @AuthenticationPrincipal CustomUserDetails user) {
        return storeService.update(id, req, uid(user));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails user) {
        storeService.delete(id, uid(user));
    }

    @PutMapping("/{id}/catalogs/{catalogId}")
    public StoreResponse assignCatalog(@PathVariable Long id,
                                       @PathVariable Long catalogId,
                                       @AuthenticationPrincipal CustomUserDetails user) {
        return storeService.assignCatalog(id, catalogId, uid(user));
    }

    @DeleteMapping("/catalogs/{catalogId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unassignCatalog(@PathVariable Long catalogId,
                                @AuthenticationPrincipal CustomUserDetails user) {
        storeService.unassignCatalog(catalogId, uid(user));
    }

    @GetMapping("/slug-suggestion")
    public Map<String, String> slugSuggestion(@RequestParam String name,
                                               @AuthenticationPrincipal CustomUserDetails user) {
        return Map.of("slug", storeService.suggestSlug(name, uid(user)));
    }

    private Long uid(CustomUserDetails u) { return u.getUserId(); }
}
