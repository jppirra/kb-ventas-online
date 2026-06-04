# Buenas prácticas y convenciones — KB Gastos

Patrones y reglas observadas y acordadas durante el desarrollo del proyecto.

---

## Backend (Java / Spring Boot)

### Estructura de controllers

- El controller solo extrae parámetros del request y el contexto de seguridad, y delega al service.
- El `userId` y `householdId` se extraen siempre del JWT, nunca del request body.
- Ejemplo de extracción de contexto:

```java
private Long getUserId() {
    UsernamePasswordAuthenticationToken auth =
        (UsernamePasswordAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
    return jwtTokenProvider.getUserIdFromToken((String) auth.getCredentials());
}
```

### Validaciones de acceso en services

- Toda operación sensible valida acceso antes de ejecutar.
- Métodos de validación reutilizables: `requireMember()`, `requireRole()`, `requireTripOwner()`, `requireApprover()`.
- Si falla la autorización, lanzar `ResponseStatusException` con HTTP 403.

```java
private void requireRole(Company company, User user, CompanyMember.Role minRole) {
    CompanyMember.Role role = getMemberRole(company, user);
    if (role == null) throw FORBIDDEN("No tenés acceso a esta empresa.");
    // ...
}
```

### Emails asincrónicos

- Todos los envíos de email son `@Async` (fire-and-forget), excepto `sendTestEmail` que es síncrono para el panel admin.
- Nunca bloquear un request HTTP esperando que se envíe un email.

### Configuración externalizada

- **Cero valores hardcodeados** en `application.properties`. Todo vía `${ENV_VAR:default}`.
- Los valores de configuración dinámicos (subjects de email, colores, URLs) van en la tabla `app_config` y se leen con `configRepository.findById(key).orElse(defaultValue)`.

### DataMigration (startup)

- `DataMigration implements ApplicationRunner` ejecuta al inicio.
- Tareas: migraciones de schema no destructivas, seed de configuración default, sincronización de `app_base_url` con el env var.
- Patrón para seed idempotente:

```java
if (configRepository.findById(key).isEmpty()) {
    configRepository.save(...);
}
```

- Para valores que deben reflejar el env var actual (como `app.base_url`), actualizar si todavía apunta a `localhost`:

```java
configRepository.findById("app.base_url").ifPresentOrElse(cfg -> {
    if (cfg.getValue().startsWith("http://localhost")) {
        cfg.setValue(appBaseUrl);
        configRepository.save(cfg);
    }
}, () -> /* insert */);
```

### DTOs

- Nunca exponer entidades JPA directamente en los endpoints (excepto Category por simplicidad con @JsonIgnore selectivo).
- `@JsonProperty` para calcular campos derivados sin romper el mapping JPA:

```java
@JsonProperty("householdId")
public Long getHouseholdId() {
    return household != null ? household.getId() : null;
}
```

---

## Frontend (React)

### Llamadas a la API

- Todas las llamadas usan la instancia `api` de `src/api/axios.js`, nunca `axios` directamente.
- URLs siempre relativas: `/expenses`, `/categories`, etc. Nunca hardcodear el dominio del backend.
- Errores: mostrar con `toast.error(err.response?.data?.message || 'Mensaje genérico')`.

### Estado

- Estado global: solo AuthContext y ThemeContext.
- Estado de formularios, loading, errores: `useState` local en el componente.
- No usar `useEffect` con dependencias vacías `[]` para fetches si el componente puede quedar montado entre navegaciones. En ese caso, usar `useCallback` + `useEffect` con las dependencias correctas.

### Componentes

- Componentes de una sola responsabilidad. Si un componente supera ~200 líneas, considerar extracción.
- Modales de confirmación para acciones destructivas (eliminar categoría, eliminar miembro, etc.).
- Mensajes de error en español. Nunca exponer mensajes técnicos del backend directamente al usuario.

### Rutas protegidas

- Toda ruta autenticada pasa por `<ProtectedRoute>`.
- Las rutas de admin verifican `user.appAdmin`.

### Accesibilidad de roles

- Verificar roles en el frontend para ocultar acciones que el usuario no puede ejecutar.
- El backend igual las rechaza (defensa en profundidad), pero la UI no debe mostrar acciones imposibles.
- Ejemplo: botones de aprobar/rechazar solo si `isApprover === true`, donde `isApprover` se deriva de `trip.companyRole` que viene del backend.

### Seguridad

- Las variables `VITE_*` son públicas (embebidas en el bundle). Nunca poner secretos ahí.
- Credenciales de Supabase: usar solo el `anon key`, nunca el `service_role key` en el frontend.

---

## Git

- Ver [git-workflow.md](./git-workflow.md) para convenciones de commits.
- **Nunca** incluir `Co-Authored-By: Claude` en los commits — rompe el auto-deploy de Vercel en repos privados con plan Hobby.

---

## Seguridad

- Ver [secrets-checklist.md](./secrets-checklist.md) para el checklist completo.
- `.gitleaks.toml` escanea los commits en busca de secretos antes de pushear.
- Toda credencial va en variables de entorno. El repositorio no debe contener ningún secreto.
