# Evidencia E2E en base aislada

Fecha: 2026-11-09, America/Bogota.

## Entorno

- PostgreSQL 16.15 en contenedor local `dpm-postgres`.
- Base ficticia y exclusiva de la corrida: `dpm_e2e_codex`.
- Esquema aplicado desde `database/01_schema.sql`, seed ilustrativo desde `database/02_seed.sql` y hashes ficticios para E2E desde `database/04_seed_e2e.sql`.
- API Express levantada en `localhost:3002` con `CORS_ORIGIN=http://localhost:4175`, `LOGIN_RATE_LIMIT_MAX=100` únicamente para la prueba local.
- Frontend Vite levantado en `localhost:4175` con `VITE_API_URL=http://localhost:3002`.
- No se usó la base `dpm_sas` ni se borraron sus datos.

## Comandos y resultado

```text
npx playwright test
Running 27 tests using 1 worker
25 passed
2 skipped
0 failed
Duration: 1.9m
```

Los 27 casos corresponden a ocho escenarios funcionales por navegador y un smoke de accesibilidad por navegador. Los dos `skip` son el escenario mutativo de iniciar/finalizar una orden en Firefox y WebKit; se ejecuta una sola vez en Chromium para no repetir el cambio persistente.

La corrida cubrió login real con cookie HttpOnly, dashboard administrativo, editor multipaso de cotizaciones, portal de cliente, portal mobile-first de operario, reintento de API, inicio/finalización persistente en Chromium, navegación por teclado y sesión expirada.

## Corrección de aislamiento

La prueba de integración verifica la revocación de sesión desactivando temporalmente al administrador. Ahora restaura `usuarios.activo=true` después de la aserción, para no contaminar una corrida E2E posterior cuando se reutiliza una base local. En CI y en esta evidencia E2E se usa una base exclusiva.

La evidencia usa datos ficticios y no demuestra validación empresarial, disponibilidad productiva ni un SLA.

