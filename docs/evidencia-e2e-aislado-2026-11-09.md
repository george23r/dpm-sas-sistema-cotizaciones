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

## Correcciones posteriores y CI

La corrida remota inicial detectó una condición de fecha en la navegación mensual: GitHub Actions ejecuta en UTC y el primer día del mes se estaba formateando con America/Bogota, por lo que diciembre podía mostrarse como noviembre. Se separaron las claves de calendario de la fecha real de Bogotá y se hizo funcional la actualización del estado de navegación.

También se añadió una espera explícita al cerrar el diálogo de programación antes de validar la navegación. La prueba específica de agenda pasó en los tres navegadores (`3 passed`, 22,5 s).

La verificación CI final del commit `cb32226` terminó:

```text
Verificar prototipo React: success
Verificar API y PostgreSQL: success
Verificar flujo E2E web: success
```

La evidencia corresponde a datos ficticios y no sustituye validación empresarial ni despliegue productivo.
