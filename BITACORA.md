# Bitácora de trabajo

## 2026-09-17 — Jorge y Richard: se creó el repositorio, se definió el Product Backlog inicial (HU-01 a HU-08), se configuró la nomenclatura de ramas por historia de usuario y se subió el primer commit con README.md, BITACORA.md y el documento de trabajo de grado en /docs.

## 2026-11-08 — Auditoría Fase 0

Se inspeccionó el repositorio existente y el documento `REFERENCIAS_DISENO_DPM_SAS.md`. Se confirmó que el código actual es un prototipo React/Vite con datos en memoria: no hay API Express, PostgreSQL, autenticación real, `src/api`, pantallas de jornadas/reportes/clientes/trabajadores/catálogo ni pruebas configuradas. `npm ci` y `npm run build` pasan; `npm run lint` termina con código 0 y advertencias; `npm run test:unit` está bloqueado porque no existe el script. La tabla completa de diferencias y los contratos pendientes están en `docs/auditoria-fase-0.md`. Se preservaron los cambios locales preexistentes.

Se preparó la primera capa de Fase 1 en frontend: cliente HTTP con cookies, adaptadores de autenticación y sesión basada en `/auth/me`; el selector de rol quedó restringido a `VITE_DEMO_MODE=true`. La evidencia y el bloqueo E2E están en `docs/fase-1-evidencia.md`.

Se auditó el SQL real de la rama de Corte 2 y se incorporaron al checkout los artefactos `database/` y `docs/arquitectura/` sin sobrescribir el frontend. El esquema tiene 12 tablas y no las entidades de líneas/visitas/planillas descritas en el alcance posterior. Se implementó backend Fase 1 en `backend/` con Express, `pg`, autenticación por cookie HttpOnly, health/readiness, middleware de autorización y pruebas unitarias. La evidencia está en `docs/backend-fase-1-evidencia.md`; PostgreSQL no pudo validarse porque `psql` no está instalado y el daemon Docker no estaba iniciado.
