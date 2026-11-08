# Backend Fase 1 — evidencia

**Fecha:** 2026-11-08 (America/Bogota)  
**Estado:** implementado parcialmente y verificable sin base conectada; no es Done E2E.

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
| `GET /ready` | Requiere autenticación; sin cookie devuelve HTTP 401. No se comprobó conexión DB porque PostgreSQL no está disponible. |
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
| servidor + `GET /ready` sin sesión | PASS de autorización, HTTP 401. |
| PostgreSQL 16 temporal | BLOQUEADO: Docker instalado, daemon no iniciado; `psql` no instalado. |

## Brechas y próximos pasos

- No se marca integración DB ni login real como PASS hasta ejecutar el esquema/seed/checks contra PostgreSQL 16.
- El seed contiene hashes marcadores; se requiere seed de desarrollo con hashes bcrypt reales, sin usar sus tarifas como políticas.
- El SQL actual sí tiene líneas, visitas, costos, hitos, servicios y planillas; quedan pendientes los repositorios, servicios, rutas y pruebas de integración que los consuman.
- Falta suite de integración HTTP + PostgreSQL, RBAC negativo, OpenAPI servido bajo autorización y CI backend.
