package com.jafpsoft.ventas.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class MigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(ApplicationArguments args) {
        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='user_id' AND is_nullable='YES'",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id BIGINT",
            "user_id column"
        );

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='is_active'",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE",
            "is_active column"
        );

        // Drop NOT NULL on catalog_id so products can exist without a catalog (repository)
        dropNotNullIfNeeded();

        // Backfill user_id from catalog's user_id for existing products
        backfillUserId();

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='show_when_out_of_stock'",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS show_when_out_of_stock BOOLEAN NOT NULL DEFAULT FALSE",
            "show_when_out_of_stock column"
        );

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='offer_price'",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_price NUMERIC(19,2)",
            "offer_price column"
        );

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='catalogs' AND column_name='store_id'",
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

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='order_requests' AND column_name='customer_phone'",
            "ALTER TABLE order_requests ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30)",
            "order_requests.customer_phone column"
        );

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='order_requests' AND column_name='vendor_notes'",
            "ALTER TABLE order_requests ADD COLUMN IF NOT EXISTS vendor_notes TEXT",
            "order_requests.vendor_notes column"
        );

        try {
            jdbc.execute(
                "CREATE TABLE IF NOT EXISTS order_requests (" +
                "  id BIGSERIAL PRIMARY KEY," +
                "  catalog_id BIGINT," +
                "  catalog_name VARCHAR(255)," +
                "  vendor_user_id BIGINT," +
                "  customer_name VARCHAR(255)," +
                "  items_json TEXT," +
                "  total NUMERIC(19,2)," +
                "  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'," +
                "  created_at TIMESTAMP NOT NULL DEFAULT NOW()" +
                ")"
            );
            log.info("Migration applied: order_requests table");
        } catch (Exception e) {
            log.warn("Migration skipped for order_requests table: {}", e.getMessage());
        }

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='extra_images_json'",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS extra_images_json TEXT",
            "extra_images_json column"
        );

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='video_url'",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT",
            "video_url column"
        );

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='variants_json'",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS variants_json TEXT",
            "variants_json column"
        );

        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='catalogs' AND column_name='public_id'",
            "ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS public_id VARCHAR(36)",
            "catalogs.public_id column"
        );

        backfillCatalogPublicIds();

        try {
            jdbc.execute(
                "CREATE TABLE IF NOT EXISTS catalog_reports (" +
                "  id BIGSERIAL PRIMARY KEY," +
                "  catalog_id BIGINT NOT NULL," +
                "  reason VARCHAR(50) NOT NULL," +
                "  details TEXT," +
                "  created_at TIMESTAMP NOT NULL DEFAULT NOW()" +
                ")"
            );
            log.info("Migration applied: catalog_reports table");
        } catch (Exception e) {
            log.warn("Migration skipped for catalog_reports table: {}", e.getMessage());
        }

        try {
            jdbc.execute(
                "CREATE TABLE IF NOT EXISTS notifications (" +
                "  id BIGSERIAL PRIMARY KEY," +
                "  user_id BIGINT NOT NULL," +
                "  type VARCHAR(50)," +
                "  title VARCHAR(200)," +
                "  message TEXT," +
                "  reference_id BIGINT," +
                "  is_read BOOLEAN NOT NULL DEFAULT FALSE," +
                "  created_at TIMESTAMP NOT NULL DEFAULT NOW()" +
                ")"
            );
            log.info("Migration applied: notifications table");
        } catch (Exception e) {
            log.warn("Migration skipped for notifications table: {}", e.getMessage());
        }

        try {
            jdbc.execute("CREATE TABLE IF NOT EXISTS app_settings (key VARCHAR(100) PRIMARY KEY, value TEXT)");
            log.info("Migration applied: app_settings table");
        } catch (Exception e) {
            log.warn("Migration skipped for app_settings table: {}", e.getMessage());
        }

        // ── Módulo facturación fiscal ────────────────────────────────────────
        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='ticket_configs' AND column_name='afip_enabled'",
            "ALTER TABLE ticket_configs ADD COLUMN IF NOT EXISTS afip_enabled BOOLEAN NOT NULL DEFAULT FALSE",
            "ticket_configs.afip_enabled"
        );
        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='ticket_configs' AND column_name='afip_ambiente'",
            "ALTER TABLE ticket_configs ADD COLUMN IF NOT EXISTS afip_ambiente VARCHAR(15) DEFAULT 'HOMOLOGACION'",
            "ticket_configs.afip_ambiente"
        );
        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='ticket_configs' AND column_name='afip_cert_p12'",
            "ALTER TABLE ticket_configs ADD COLUMN IF NOT EXISTS afip_cert_p12 TEXT",
            "ticket_configs.afip_cert_p12"
        );
        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='ticket_configs' AND column_name='afip_cert_password'",
            "ALTER TABLE ticket_configs ADD COLUMN IF NOT EXISTS afip_cert_password TEXT",
            "ticket_configs.afip_cert_password"
        );
        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='ticket_configs' AND column_name='afip_cert_expiry'",
            "ALTER TABLE ticket_configs ADD COLUMN IF NOT EXISTS afip_cert_expiry DATE",
            "ticket_configs.afip_cert_expiry"
        );
        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='ticket_configs' AND column_name='afip_cert_subject'",
            "ALTER TABLE ticket_configs ADD COLUMN IF NOT EXISTS afip_cert_subject VARCHAR(300)",
            "ticket_configs.afip_cert_subject"
        );
        applyIfNeeded(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='ticket_configs' AND column_name='afip_cert_notified_expiry'",
            "ALTER TABLE ticket_configs ADD COLUMN IF NOT EXISTS afip_cert_notified_expiry BOOLEAN NOT NULL DEFAULT FALSE",
            "ticket_configs.afip_cert_notified_expiry"
        );

        try {
            jdbc.execute(
                "CREATE TABLE IF NOT EXISTS invoice_records (" +
                "  id               BIGSERIAL PRIMARY KEY," +
                "  user_id          BIGINT NOT NULL," +
                "  sale_ticket_id   BIGINT," +
                "  correlation_id   VARCHAR(36) NOT NULL UNIQUE," +
                "  tipo_cbte        INTEGER NOT NULL," +
                "  punto_venta      INTEGER NOT NULL," +
                "  nro_cbte         BIGINT," +
                "  cuit_emisor      VARCHAR(11)," +
                "  doc_tipo         INTEGER," +
                "  doc_nro          BIGINT," +
                "  concepto         INTEGER," +
                "  cbte_fecha       VARCHAR(8)," +
                "  imp_total        NUMERIC(15,2)," +
                "  imp_neto         NUMERIC(15,2)," +
                "  imp_iva          NUMERIC(15,2)," +
                "  aliciva_id       INTEGER," +
                "  moneda           VARCHAR(3) DEFAULT 'PES'," +
                "  cae              VARCHAR(14)," +
                "  cae_expiry       DATE," +
                "  status           VARCHAR(20) NOT NULL," +
                "  afip_result_code INTEGER," +
                "  afip_result_msg  VARCHAR(1000)," +
                "  qr_data          TEXT," +
                "  xml_request      TEXT," +
                "  xml_response     TEXT," +
                "  ambiente         VARCHAR(15)," +
                "  requested_at     TIMESTAMP NOT NULL DEFAULT NOW()" +
                ")"
            );
            log.info("Migration applied: invoice_records table");
        } catch (Exception e) {
            log.warn("Migration skipped for invoice_records table: {}", e.getMessage());
        }

        try {
            jdbc.execute(
                "CREATE TABLE IF NOT EXISTS billing_audit_logs (" +
                "  id             BIGSERIAL PRIMARY KEY," +
                "  user_id        BIGINT," +
                "  correlation_id VARCHAR(36)," +
                "  operation      VARCHAR(50)," +
                "  status         VARCHAR(20)," +
                "  ambiente       VARCHAR(15)," +
                "  duration_ms    BIGINT," +
                "  error_message  VARCHAR(2000)," +
                "  detail         TEXT," +
                "  created_at     TIMESTAMP NOT NULL DEFAULT NOW()" +
                ")"
            );
            log.info("Migration applied: billing_audit_logs table");
        } catch (Exception e) {
            log.warn("Migration skipped for billing_audit_logs table: {}", e.getMessage());
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
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='catalog_id' AND is_nullable='NO'",
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

    private void backfillCatalogPublicIds() {
        try {
            List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id FROM catalogs WHERE public_id IS NULL OR public_id = ''");
            for (Map<String, Object> row : rows) {
                Long id = ((Number) row.get("id")).longValue();
                jdbc.update("UPDATE catalogs SET public_id = ? WHERE id = ?", UUID.randomUUID().toString(), id);
            }
            if (!rows.isEmpty()) log.info("Backfilled public_id for {} catalogs", rows.size());
        } catch (Exception e) {
            log.warn("Backfill catalogs.public_id skipped: {}", e.getMessage());
        }
    }
}
