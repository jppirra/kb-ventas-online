package com.jafpsoft.ventas.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Service
public class StorageService {

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key:}")
    private String serviceRoleKey;

    @Value("${supabase.bucket:catalog-images}")
    private String bucket;

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        if (supabaseUrl.isBlank() || serviceRoleKey.isBlank()) {
            throw new IllegalStateException("Supabase no configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
        }

        String ext = getExtension(file.getOriginalFilename());
        String path = folder + "/" + UUID.randomUUID() + "." + ext;
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;

        MediaType contentType = MediaType.parseMediaType(
                file.getContentType() != null ? file.getContentType() : "image/jpeg");

        log.info("Uploading to Supabase: bucket={} path={} size={}bytes", bucket, path, file.getSize());

        try {
            RestClient.create()
                    .post()
                    .uri(uploadUrl)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("x-upsert", "true")
                    .contentType(contentType)
                    .contentLength(file.getSize())
                    .body(new InputStreamResource(file.getInputStream()))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.error("Supabase upload failed bucket={} path={}: {}", bucket, path, e.getMessage());
            throw new IllegalArgumentException("Error al subir imagen: " + e.getMessage());
        }

        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + path;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
