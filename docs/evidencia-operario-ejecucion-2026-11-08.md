# Evidencia de ejecuciÃ³n de orden por operario â€” 2026-11-08

## Alcance

Se aÃ±adiÃ³ a `e2e/roles.spec.ts` el escenario `operario inicia y finaliza una orden con persistencia de API`. La prueba usa el portal mobile-first con viewport de 360 Ã— 800 px y recorre:

1. inicio de sesiÃ³n real mediante cookie HttpOnly;
2. consulta de Ã³rdenes de la cuadrilla desde `GET /api/v1/ordenes/mias`;
3. apertura de una orden pendiente;
4. inicio mediante `PATCH /api/v1/ordenes/:id/iniciar`;
5. registro de nota de finalizaciÃ³n;
6. cierre mediante `PATCH /api/v1/ordenes/:id/finalizar`;
7. retorno al listado de Ã³rdenes.

La orden pertenece a la cuadrilla asociada al usuario ficticio de E2E. No se usaron IDs demo ni se simulÃ³ una respuesta de la API.

## Entorno reproducible

- PostgreSQL 16 en el contenedor local `dpm-postgres`.
- Base temporal `dpm_codex_test_20261108`.
- PreparaciÃ³n: `database/01_schema.sql`, `database/02_seed.sql` y `database/04_seed_e2e.sql`.
- API Express en `http://localhost:3000`.
- Frontend Vite en `http://127.0.0.1:5173`.
- SesiÃ³n con cookie HttpOnly; origen CORS configurado para `http://127.0.0.1:5173`.

## Resultado

Comando ejecutado:

```text
npx playwright test e2e/roles.spec.ts
```

Resultado real del 2026-11-08:

```text
22 passed
2 skipped
0 failed
```

La prueba mutativa se ejecuta solo en Chromium porque cambia el estado persistente de una orden de prueba. Firefox y WebKit sÃ­ ejecutan los escenarios de lectura, aislamiento, sesiÃ³n y reintento; no se presenta el escenario mutativo como probado en esos motores.

## Limitaciones

- Los datos son ficticios y pertenecen a una base temporal de desarrollo.
- Esta evidencia demuestra el flujo tÃ©cnico y los permisos implementados; no constituye validaciÃ³n empresarial por parte de DPM.
- La disponibilidad definitiva y las transiciones de estado siguen protegidas por el servidor y PostgreSQL.

