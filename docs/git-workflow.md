# Git Workflow — KB Gastos

## Identidad del autor

Todos los commits deben ir firmados con:

```bash
git config user.name "jpirra"
git config user.email "pirrajuanpablo@gmail.com"
```

Configurar globalmente en una PC nueva:

```bash
git config --global user.name "jpirra"
git config --global user.email "pirrajuanpablo@gmail.com"
```

Verificar:

```bash
git config user.name    # debe mostrar: jpirra
git config user.email   # debe mostrar: pirrajuanpablo@gmail.com
```

---

## Rama principal

`main` — única rama activa. No hay ramas de feature ni desarrollo por separado. Todo se trabaja directo en `main`.

Cada push a `main` dispara deploy automático:
- Frontend → Vercel (via GitHub Actions webhook)
- Backend → Render (conectado directo al repo)

---

## Convención de commits

### Formato

```
<tipo>: <descripción en minúsculas, sin punto final>
```

### Tipos usados

| Tipo | Cuándo usar |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Cambio de código sin agregar ni corregir funcionalidad |
| `docs` | Solo cambios en documentación |
| `chore` | Tareas de mantenimiento (dependencias, config, scripts) |

### Ejemplos reales del proyecto

```
feat: seed default categories when a new household is created
feat: proxy /api/* through Vercel to hide backend URL
feat: add dismissible category tip in transactions page
fix: expose householdId in Category JSON to show edit/delete buttons
fix: sync app.base_url from env var on startup if still pointing to localhost
fix: correct settings route in tip and make category action buttons always visible
fix: use /households/init endpoint in OnboardingWizard
fix: rebrand JAFSoftware to JAFPSoft.com across footer and terms
feat: migrate email from SMTP to Resend REST API
feat: add DB liveness check to health endpoint
```

### Reglas

- Descripción en español o inglés — consistencia dentro de un mismo commit.
- **Nunca** agregar `Co-Authored-By: Claude` — rompe el auto-deploy de Vercel Hobby en repos privados.
- No usar `--no-verify` para saltear gitleaks salvo necesidad explícita.

---

## Flujo de trabajo habitual

```bash
# 1. Hacer cambios
# 2. Revisar qué cambió
git status
git diff

# 3. Agregar archivos específicos (nunca git add -A en bulk)
git add backend/src/main/java/com/kbgastos/service/SomeService.java
git add frontend/src/pages/SomePage.jsx

# 4. Commit
git commit -m "feat: descripción del cambio"

# 5. Push (dispara deploys automáticos)
git push
```

---

## Comandos frecuentes de diagnóstico

```bash
# Ver estado del árbol de trabajo
git status

# Ver historial reciente
git log --oneline -10

# Ver qué cambió en el último commit
git show --stat HEAD

# Ver diferencias sin commitear
git diff

# Ver diferencias ya en staging
git diff --staged
```

---

## Rollback de emergencia

```bash
# Revertir el último commit (mantiene los cambios en working tree)
git revert HEAD

# Ver commits recientes para encontrar el punto anterior
git log --oneline -5

# Nunca usar force-push a main
```
