package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.catalog.CatalogRequest;
import com.jafpsoft.ventas.dto.catalog.CatalogResponse;
import com.jafpsoft.ventas.dto.catalog.ProductRequest;
import com.jafpsoft.ventas.dto.catalog.ProductResponse;
import com.jafpsoft.ventas.service.CatalogService;
import com.jafpsoft.ventas.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public List<CatalogResponse> list(@AuthenticationPrincipal CustomUserDetails user) {
        return catalogService.listByUser(getUserId(user));
    }

    @GetMapping("/{id}")
    public CatalogResponse get(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails user) {
        return catalogService.getById(id, getUserId(user));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogResponse create(@Valid @RequestBody CatalogRequest req,
                                  @AuthenticationPrincipal CustomUserDetails user) {
        return catalogService.create(req, getUserId(user));
    }

    @PutMapping("/{id}")
    public CatalogResponse update(@PathVariable Long id,
                                  @Valid @RequestBody CatalogRequest req,
                                  @AuthenticationPrincipal CustomUserDetails user) {
        return catalogService.update(id, req, getUserId(user));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails user) {
        catalogService.delete(id, getUserId(user));
    }

    @PostMapping("/{id}/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse addProduct(@PathVariable Long id,
                                      @Valid @RequestBody ProductRequest req,
                                      @AuthenticationPrincipal CustomUserDetails user) {
        return catalogService.addProduct(id, req, getUserId(user));
    }

    @PutMapping("/{id}/products/{productId}")
    public ProductResponse updateProduct(@PathVariable Long id,
                                         @PathVariable Long productId,
                                         @Valid @RequestBody ProductRequest req,
                                         @AuthenticationPrincipal CustomUserDetails user) {
        return catalogService.updateProduct(id, productId, req, getUserId(user));
    }

    @DeleteMapping("/{id}/products/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id,
                              @PathVariable Long productId,
                              @AuthenticationPrincipal CustomUserDetails user) {
        catalogService.deleteProduct(id, productId, getUserId(user));
    }

    @PutMapping("/{id}/products/{productId}/toggle-active")
    public ProductResponse toggleProductActive(@PathVariable Long id,
                                               @PathVariable Long productId,
                                               @AuthenticationPrincipal CustomUserDetails user) {
        return catalogService.toggleProductActive(id, productId, getUserId(user));
    }

    @PutMapping("/{id}/products/{productId}/unlink")
    public ProductResponse unlinkProduct(@PathVariable Long id,
                                         @PathVariable Long productId,
                                         @AuthenticationPrincipal CustomUserDetails user) {
        return catalogService.unlinkProduct(id, productId, getUserId(user));
    }

    @PutMapping("/{id}/assign/{productId}")
    public ProductResponse assignProduct(@PathVariable Long id,
                                         @PathVariable Long productId,
                                         @AuthenticationPrincipal CustomUserDetails user) {
        return catalogService.assignProductToCatalog(id, productId, getUserId(user));
    }

    @PostMapping("/{id}/upload")
    public ResponseEntity<Map<String, Object>> uploadExcel(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails user) throws IOException {
        List<ProductResponse> products = catalogService.importFromExcel(id, file, getUserId(user));
        return ResponseEntity.ok(Map.of("imported", products.size(), "products", products));
    }

    @PostMapping("/{id}/generate")
    public ResponseEntity<Map<String, String>> generate(@PathVariable Long id,
                                                        @AuthenticationPrincipal CustomUserDetails user) {
        catalogService.generateAiContent(id, getUserId(user));
        return ResponseEntity.accepted().body(Map.of("message", "Generación de contenido IA iniciada"));
    }

    @PostMapping("/{id}/products/{productId}/upload-image")
    public ResponseEntity<Map<String, String>> uploadProductImage(
            @PathVariable Long id,
            @PathVariable Long productId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails user) throws IOException {
        return ResponseEntity.ok(catalogService.uploadProductImage(id, productId, file, getUserId(user)));
    }

    @PostMapping("/{id}/upload-background")
    public ResponseEntity<Map<String, String>> uploadBackground(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails user) throws IOException {
        return ResponseEntity.ok(catalogService.uploadCatalogBackground(id, file, getUserId(user)));
    }

    private Long getUserId(CustomUserDetails user) { return user.getUserId(); }
}

