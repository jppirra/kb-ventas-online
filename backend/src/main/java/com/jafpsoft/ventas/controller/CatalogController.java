package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.catalog.CatalogRequest;
import com.jafpsoft.ventas.dto.catalog.CatalogResponse;
import com.jafpsoft.ventas.dto.catalog.ProductRequest;
import com.jafpsoft.ventas.dto.catalog.ProductResponse;
import com.jafpsoft.ventas.service.CatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/catalogs")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping
    public List<CatalogResponse> list(@AuthenticationPrincipal UserDetails user) {
        return catalogService.listByUser(getUserId(user));
    }

    @GetMapping("/{id}")
    public CatalogResponse get(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        return catalogService.getById(id, getUserId(user));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogResponse create(@Valid @RequestBody CatalogRequest req,
                                  @AuthenticationPrincipal UserDetails user) {
        return catalogService.create(req, getUserId(user));
    }

    @PutMapping("/{id}")
    public CatalogResponse update(@PathVariable Long id,
                                  @Valid @RequestBody CatalogRequest req,
                                  @AuthenticationPrincipal UserDetails user) {
        return catalogService.update(id, req, getUserId(user));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        catalogService.delete(id, getUserId(user));
    }

    @PostMapping("/{id}/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse addProduct(@PathVariable Long id,
                                      @Valid @RequestBody ProductRequest req,
                                      @AuthenticationPrincipal UserDetails user) {
        return catalogService.addProduct(id, req, getUserId(user));
    }

    @PutMapping("/{id}/products/{productId}")
    public ProductResponse updateProduct(@PathVariable Long id,
                                         @PathVariable Long productId,
                                         @Valid @RequestBody ProductRequest req,
                                         @AuthenticationPrincipal UserDetails user) {
        return catalogService.updateProduct(id, productId, req, getUserId(user));
    }

    @DeleteMapping("/{id}/products/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id,
                              @PathVariable Long productId,
                              @AuthenticationPrincipal UserDetails user) {
        catalogService.deleteProduct(id, productId, getUserId(user));
    }

    @PostMapping("/{id}/upload")
    public ResponseEntity<Map<String, Object>> uploadExcel(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails user) throws IOException {
        List<ProductResponse> products = catalogService.importFromExcel(id, file, getUserId(user));
        return ResponseEntity.ok(Map.of("imported", products.size(), "products", products));
    }

    @PostMapping("/{id}/generate")
    public ResponseEntity<Map<String, String>> generate(@PathVariable Long id,
                                                        @AuthenticationPrincipal UserDetails user) {
        catalogService.generateAiContent(id, getUserId(user));
        return ResponseEntity.accepted().body(Map.of("message", "Generación de contenido IA iniciada"));
    }

    private Long getUserId(UserDetails user) {
        return Long.parseLong(user.getUsername());
    }
}
