package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.AppSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppSettingRepository extends JpaRepository<AppSetting, String> {
}
