# API DPM S.A.S.

Backend Node.js, Express y TypeScript para conectar la aplicaciÃ³n React con PostgreSQL. Usa consultas parametrizadas, transacciones, validaciÃ³n de entrada, autorizaciÃ³n por rol y sesiones mediante cookie HttpOnly.

## Desarrollo local

1. Instala PostgreSQL 16 y crea una base dedicada.
2. Copia `.env.example` a `.env` y define `DATABASE_URL`, `CORS_ORIGIN` y `SESSION_SECRET`.
3. En una base desechable aplica `../database/01_schema.sql` y `../database/02_seed.sql`.

`01_schema.sql` borra y recrea `dpm`; nunca se debe ejecutar sobre producciÃ³n. El seed es ficticio.

```bash
npm ci
npm run build
npm run lint
npm test
npm run dev
```

## Rutas principales

- `GET /health` y `GET /ready`.
- `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`.
- `GET/POST /api/v1/cotizaciones`, `GET/PATCH /api/v1/cotizaciones/:id` y operaciones de visita, lÃ­neas, costos, hitos, envÃ­o y respuesta.
- `GET/POST /api/v1/ordenes`, `GET/PATCH /api/v1/ordenes/:id`, `/ordenes/mias`, `/iniciar` y `/finalizar`.
- `GET/POST/PATCH /api/v1/clientes`, `/zonas`, `/operarios` y `/cuadrillas`, ademÃ¡s de miembros de cuadrilla.
- `GET /api/v1/servicios` sin tarifas ficticias.
- `GET/POST /api/v1/planillas`, `POST /api/v1/planillas/par` (creaciÃ³n atÃ³mica campo/administrativa), registros, comparaciÃ³n y conciliaciÃ³n.
- `GET /api/v1/reportes/periodo`.

Las respuestas no exponen `password_hash`, costos internos a clientes ni recursos de otros clientes. La autorizaciÃ³n se verifica en el servidor; el selector de rol del frontend no concede permisos.

## IntegraciÃ³n reproducible

`npm run test:integration` es opt-in y requiere `RUN_INTEGRATION=1`, PostgreSQL temporal y credenciales ficticias definidas mediante variables `INTEGRATION_*`. Comprueba autenticaciÃ³n, propiedad, cotizaciÃ³n completa, aceptaciÃ³n, orden, planillas, conciliaciÃ³n bloqueada, CRUD administrativo y lÃ­der Ãºnico.

El smoke E2E del frontend estÃ¡ en `../e2e/roles.spec.ts` y se ejecuta desde la raÃ­z con `npm run test:e2e`; el workflow prepara la base con `database/04_seed_e2e.sql` y levanta esta API junto al frontend.

La evidencia ejecutada el 2026-11-08 estÃ¡ en [`../docs/fase-3-4-evidencia-actualizacion-2026-11-08.md`](../docs/fase-3-4-evidencia-actualizacion-2026-11-08.md). La integraciÃ³n pasÃ³ con 1 prueba y 0 fallos contra PostgreSQL 16 temporal.

## Seguridad y despliegue

En producciÃ³n se requiere HTTPS, `COOKIE_SECURE=true`, CORS con origen explÃ­cito, `COOKIE_SAMESITE=none` solo cuando sea necesario por separaciÃ³n de orÃ­genes y TLS verificable para PostgreSQL. No se registran credenciales ni se persisten tokens en el navegador. `/ready` comprueba infraestructura y no exige autenticaciÃ³n de usuario.

## Brechas declaradas

El smoke E2E de navegador tiene PASS en CI con Chromium, Firefox y WebKit, PostgreSQL temporal y nueve pruebas de perfiles. La mediciÃ³n local de RNF-03 estÃ¡ documentada en `../performance/evidencia-2026-11-08.md`, con 2.010 muestras y 0 errores; no se presenta como SLA ni como validaciÃ³n de DPM. Tampoco se presentan como validadas por DPM las reglas de liderazgo, tarifas, recargos, autogestiÃ³n ni otros supuestos empresariales. No se implementan facturaciÃ³n electrÃ³nica, nÃ³mina, pagos ni notificaciones automÃ¡ticas.

