# Backend Fase 1 — evidencia

**Fecha:** 2026-11-08 (America/Bogota)  
**Estado:** implementado parcialmente y verificable sin base conectada; no es Done E2E.

> **Nota de actualización:** este documento conserva la fotografía histórica de Fase 1 y no debe leerse como el estado final. Posteriormente se implementaron la integración HTTP con PostgreSQL, los módulos de cotizaciones, órdenes, planillas, reportes y catálogo, además de las pruebas de integración y CI. La evidencia vigente está en [`docs/fase-3-4-evidencia-actualizacion-2026-11-08.md`](fase-3-4-evidencia-actualizacion-2026-11-08.md), [`docs/evidencia-planillas-validacion-2026-11-08.md`](evidencia-planillas-validacion-2026-11-08.md) y [`backend/README.md`](../backend/README.md). Las brechas empresariales siguen pendientes de validación con DPM. La fila de `/ready` y los comandos de esta página describen la línea base de esa fecha; no sustituyen la configuración vigente.

## Archivos agregados

- `backend/package.json`, `backend/package-lock.json`, `backend/tsconfig.json`.
- `backend/src/config`, `backend/src/db`, `backend/src/middlewares`, `backend/src/modules/auth` y `backend/src/shared`.
- `backend/src/server.ts`.
- `backend/tests/session.test.ts`.
- `backend/openapi.yaml` y `backend/README.md`.
- `database/` y `docs/arquitectura/` incorporados desde `origin/main` (`60e8ce4`), porque no estaban en el checkout local.

## Endpoints implementados

| Endpoint | Estado |
|---|---|
| `GET /health` | PASS verificado con servidor levantado: HTTP 200 y `{"status":"ok"}`. |
| `GET /ready` | Línea base histórica: en la implementación vigente es público y devuelve HTTP 200/503 según disponibilidad de PostgreSQL; no requiere sesión de usuario. |
| `POST /api/v1/auth/login` | Implementado contra `dpm.usuarios`; integración DB pendiente. |
| `GET /api/v1/auth/me` | Implementado, revalida usuario activo en DB; integración pendiente. |
| `POST /api/v1/auth/logout` | Implementado limpiando cookie HttpOnly. |

## Seguridad implementada

- Consultas parametrizadas con `pg`.
- Cookie HttpOnly, SameSite configurable y Secure en producción/`none`.
- Sesión firmada con expiración y sin `localStorage`.
- CORS con origen explícito, Helmet, límite JSON y rate limit para autenticación.
- 401 para sesión ausente/inválida y 403 para rol/origen no permitido.
- No se registra contraseña ni se devuelve `password_hash`.
- `requireRole` y `authenticate` preparados para rutas de módulos posteriores.

## Comandos y resultados

| Comando | Resultado |
|---|---|
| `npm install --prefix backend` | PASS, 126 paquetes auditados, 0 vulnerabilidades. |
| `npm run build --prefix backend` | PASS, TypeScript sin errores. |
| `npm test --prefix backend` | PASS, 2 pruebas unitarias. |
| `npm run lint --prefix backend` | PASS, código 0. |
| `npm run test:unit` | PASS, pruebas unitarias de utilidades frontend. |
| servidor + `GET /health` | PASS, HTTP 200. |
| servidor + `GET /ready` sin sesión | Resultado histórico de Fase 1; la implementación vigente separa readiness de autenticación y responde 200/503. |
| PostgreSQL 16 temporal | BLOQUEADO: Docker instalado, daemon no iniciado; `psql` no instalado. |

## Brechas y próximos pasos

- No se marca integración DB ni login real como PASS hasta ejecutar el esquema/seed/checks contra PostgreSQL 16.
- El seed contiene hashes marcadores; se requiere seed de desarrollo con hashes bcrypt reales, sin usar sus tarifas como políticas.
- El SQL actual sí tiene líneas, visitas, costos, hitos, servicios y planillas; quedan pendientes los repositorios, servicios, rutas y pruebas de integración que los consuman.
- Falta suite de integración HTTP + PostgreSQL, RBAC negativo, OpenAPI servido bajo autorización y CI backend.
