package com.jafpsoft.ventas.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(ApplicationArguments args) {
        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='products' AND column_name='user_id' AND is_nullable='YES'",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id BIGINT",
            "user_id column"
        );

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='products' AND column_name='is_active'",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE",
            "is_active column"
        );

        // Drop NOT NULL on catalog_id so products can exist without a catalog (repository)
        dropNotNullIfNeeded();

        // Backfill user_id from catalog's user_id for existing products
        backfillUserId();

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='products' AND column_name='show_when_out_of_stock'",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS show_when_out_of_stock BOOLEAN NOT NULL DEFAULT FALSE",
            "show_when_out_of_stock column"
        );

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='catalogs' AND column_name='store_id'",
            "ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS store_id BIGINT",
            "catalogs.store_id column"
        );

        try {
            jdbc.execute(
                "CREATE TABLE IF NOT EXISTS stores (" +
                "  id BIGSERIAL PRIMARY KEY," +
                "  user_id BIGINT NOT NULL REFERENCES users(id)," +
                "  name VARCHAR(255) NOT NULL," +
                "  slug VARCHAR(40) UNIQUE," +
                "  description TEXT," +
                "  logo_url TEXT," +
                "  whatsapp_number VARCHAR(30)," +
                "  is_active BOOLEAN NOT NULL DEFAULT TRUE," +
                "  created_at TIMESTAMP NOT NULL DEFAULT NOW()," +
                "  updated_at TIMESTAMP NOT NULL DEFAULT NOW()" +
                ")"
            );
            log.info("Migration applied: stores table");
        } catch (Exception e) {
            log.warn("Migration skipped for stores table: {}", e.getMessage());
        }
    }

    private void applyIfNeeded(String checkSql, String migrationSql, String label) {
        try {
            Integer count = jdbc.queryForObject(checkSql, Integer.class);
            if (count == null || count == 0) {
                jdbc.execute(migrationSql);
                log.info("Migration applied: {}", label);
            }
        } catch (Exception e) {
            log.warn("Migration skipped or failed for {}: {}", label, e.getMessage());
        }
    }

    private void dropNotNullIfNeeded() {
        try {
            // Check if catalog_id is still NOT NULL
            Integer notNullCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='products' AND column_name='catalog_id' AND is_nullable='NO'",
                Integer.class
            );
            if (notNullCount != null && notNullCount > 0) {
                jdbc.execute("ALTER TABLE products ALTER COLUMN catalog_id DROP NOT NULL");
                log.info("Migration applied: catalog_id made nullable");
            }
        } catch (Exception e) {
            log.warn("Migration skipped for catalog_id nullable: {}", e.getMessage());
        }
    }

    private void backfillUserId() {
        try {
            jdbc.execute(
                "UPDATE products p SET user_id = c.user_id FROM catalogs c WHERE p.catalog_id = c.id AND p.user_id IS NULL"
            );
        } catch (Exception e) {
            log.warn("Backfill user_id skipped: {}", e.getMessage());
        }
    }
}
