package com.jafpsoft.ventas.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key:}")
    private String serviceRoleKey;

    @Value("${supabase.bucket:catalog-images}")
    private String bucket;

    private final RestTemplate restTemplate;

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        if (supabaseUrl.isBlank() || serviceRoleKey.isBlank()) {
            throw new IllegalStateException("Supabase no configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
        }

        String ext = getExtension(file.getOriginalFilename());
        String path = folder + "/" + UUID.randomUUID() + "." + ext;

        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + path;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + serviceRoleKey);
        headers.setContentType(MediaType.parseMediaType(
                file.getContentType() != null ? file.getContentType() : "image/jpeg"));

        HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
        restTemplate.exchange(uploadUrl, HttpMethod.POST, entity, String.class);

        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + path;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
