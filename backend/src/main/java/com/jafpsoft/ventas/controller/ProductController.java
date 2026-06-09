package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.catalog.ProductRequest;
import com.jafpsoft.ventas.dto.catalog.ProductResponse;
import com.jafpsoft.ventas.security.CustomUserDetails;
import com.jafpsoft.ventas.service.ProductService;
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
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductResponse> list(@AuthenticationPrincipal CustomUserDetails user) {
        return productService.listByUser(userId(user));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest req,
                                  @AuthenticationPrincipal CustomUserDetails user) {
        return productService.create(req, userId(user));
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id,
                                  @Valid @RequestBody ProductRequest req,
                                  @AuthenticationPrincipal CustomUserDetails user) {
        return productService.update(id, req, userId(user));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id,
                       @AuthenticationPrincipal CustomUserDetails user) {
        productService.delete(id, userId(user));
    }

    @PostMapping("/upload-temp-image")
    public ResponseEntity<Map<String, String>> uploadTempImage(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails user) throws IOException {
        return ResponseEntity.ok(productService.uploadTempImage(file, userId(user)));
    }

    @PostMapping("/{id}/upload-image")
    public ResponseEntity<Map<String, String>> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails user) throws IOException {
        return ResponseEntity.ok(productService.uploadImage(id, file, userId(user)));
    }

    @PostMapping("/{id}/upload-gallery-image")
    public ResponseEntity<Map<String, String>> uploadGalleryImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails user) throws IOException {
        return ResponseEntity.ok(productService.uploadGalleryImage(id, file, userId(user)));
    }

    private Long userId(CustomUserDetails user) { return user.getUserId(); }
}
