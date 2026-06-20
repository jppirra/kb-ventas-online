package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.MercadoPagoWebhookEvent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class MercadoPagoWebhookEventRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        // Desactivar cifrado en tests (sin clave configurada)
        registry.add("app.encryption-key", () -> "");
    }

    @Autowired
    private MercadoPagoWebhookEventRepository repository;

    @Test
    void save_andFindByExternalId() {
        MercadoPagoWebhookEvent event = MercadoPagoWebhookEvent.builder()
                .externalId("payment:111111")
                .topic("payment")
                .vendorUserId(1L)
                .rawBody("{\"id\":111111}")
                .build();

        repository.save(event);

        assertTrue(repository.findByExternalId("payment:111111").isPresent());
        assertFalse(repository.findByExternalId("payment:999999").isPresent());
    }

    @Test
    void save_duplicateExternalId_throwsDataIntegrityViolationException() {
        String externalId = "payment:222222";

        repository.save(MercadoPagoWebhookEvent.builder()
                .externalId(externalId).topic("payment").vendorUserId(1L).rawBody("{}").build());

        assertThrows(DataIntegrityViolationException.class, () ->
                repository.saveAndFlush(MercadoPagoWebhookEvent.builder()
                        .externalId(externalId).topic("payment").vendorUserId(1L).rawBody("{}").build()));
    }

    @Test
    void existsByExternalId_returnsCorrectly() {
        repository.save(MercadoPagoWebhookEvent.builder()
                .externalId("payment:333333").topic("payment").vendorUserId(1L).rawBody("{}").build());

        assertTrue(repository.existsByExternalId("payment:333333"));
        assertFalse(repository.existsByExternalId("payment:000000"));
    }

    /**
     * Verifica la garantía de idempotencia bajo concurrencia:
     * 10 threads intentando insertar el mismo externalId — exactamente 1 debe tener éxito
     * y los 9 restantes deben fallar con DataIntegrityViolationException.
     */
    @Test
    void concurrentInserts_sameExternalId_onlyOneSucceeds() throws InterruptedException {
        String externalId = "payment:concurrent-test-" + System.currentTimeMillis();
        int threads = 10;

        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger(0);
        AtomicInteger failures = new AtomicInteger(0);
        List<Future<Void>> futures = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            futures.add(pool.submit(() -> {
                latch.await(); // arrancar todos al mismo tiempo
                try {
                    repository.saveAndFlush(MercadoPagoWebhookEvent.builder()
                            .externalId(externalId)
                            .topic("payment")
                            .vendorUserId(1L)
                            .rawBody("{}")
                            .build());
                    successes.incrementAndGet();
                } catch (DataIntegrityViolationException e) {
                    failures.incrementAndGet();
                }
                return null;
            }));
        }

        latch.countDown(); // liberar todos los threads
        pool.shutdown();
        assertTrue(pool.awaitTermination(15, TimeUnit.SECONDS));

        assertEquals(1, successes.get(), "Exactamente un insert debe tener éxito");
        assertEquals(threads - 1, failures.get(), "Los restantes deben fallar por UNIQUE constraint");
        assertEquals(1, repository.findAll().stream()
                .filter(e -> externalId.equals(e.getExternalId())).count());
    }
}
