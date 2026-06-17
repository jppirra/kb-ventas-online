package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final StorageService storageService;

    @PostMapping("/presign")
    public ResponseEntity<Map<String, String>> presign(
            @RequestParam String folder,
            @RequestParam(defaultValue = "jpg") String ext) {
        return ResponseEntity.ok(storageService.presignUpload(folder, ext));
    }
}
