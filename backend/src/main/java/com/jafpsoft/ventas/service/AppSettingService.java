package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.model.AppSetting;
import com.jafpsoft.ventas.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppSettingService {

    private final AppSettingRepository appSettingRepository;

    public String get(String key, String fallback) {
        return appSettingRepository.findById(key)
                .map(AppSetting::getValue)
                .filter(v -> v != null && !v.isBlank())
                .orElse(fallback);
    }

    public void set(String key, String value) {
        AppSetting setting = appSettingRepository.findById(key)
                .orElse(AppSetting.builder().key(key).build());
        setting.setValue(value);
        appSettingRepository.save(setting);
    }
}
