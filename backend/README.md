# API DPM S.A.S.

Backend Node.js, Express y TypeScript para conectar la aplicación React con PostgreSQL. Usa consultas parametrizadas, transacciones, validación de entrada, autorización por rol y sesiones mediante cookie HttpOnly.

## Desarrollo local

1. Instala PostgreSQL 16 y crea una base dedicada.
2. Copia `.env.example` a `.env` y define `DATABASE_URL`, `CORS_ORIGIN` y `SESSION_SECRET`.
3. En una base desechable aplica `../database/01_schema.sql` y `../database/02_seed.sql`.

`01_schema.sql` borra y recrea `dpm`; nunca se debe ejecutar sobre producción. El seed es ficticio.

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
- `GET/POST /api/v1/cotizaciones`, `GET/PATCH /api/v1/cotizaciones/:id` y operaciones de visita, líneas, costos, hitos, envío y respuesta.
- `GET/POST /api/v1/ordenes`, `GET/PATCH /api/v1/ordenes/:id`, `/ordenes/mias`, `/iniciar` y `/finalizar`.
- `GET/POST/PATCH /api/v1/clientes`, `/zonas`, `/operarios` y `/cuadrillas`, además de miembros de cuadrilla.
- `GET /api/v1/servicios` sin tarifas ficticias.
- `GET/POST /api/v1/planillas`, registros, comparación y conciliación.
- `GET /api/v1/reportes/periodo`.

Las respuestas no exponen `password_hash`, costos internos a clientes ni recursos de otros clientes. La autorización se verifica en el servidor; el selector de rol del frontend no concede permisos.

## Integración reproducible

`npm run test:integration` es opt-in y requiere `RUN_INTEGRATION=1`, PostgreSQL temporal y credenciales ficticias definidas mediante variables `INTEGRATION_*`. Comprueba autenticación, propiedad, cotización completa, aceptación, orden, planillas, conciliación bloqueada, CRUD administrativo y líder único.

El smoke E2E del frontend está en `../e2e/roles.spec.ts` y se ejecuta desde la raíz con `npm run test:e2e`; el workflow prepara la base con `database/04_seed_e2e.sql` y levanta esta API junto al frontend.

La evidencia ejecutada el 2026-11-08 está en [`../docs/fase-3-4-evidencia-actualizacion-2026-11-08.md`](../docs/fase-3-4-evidencia-actualizacion-2026-11-08.md). La integración pasó con 1 prueba y 0 fallos contra PostgreSQL 16 temporal.

## Seguridad y despliegue

En producción se requiere HTTPS, `COOKIE_SECURE=true`, CORS con origen explícito, `COOKIE_SAMESITE=none` solo cuando sea necesario por separación de orígenes y TLS verificable para PostgreSQL. No se registran credenciales ni se persisten tokens en el navegador. `/ready` comprueba infraestructura y no exige autenticación de usuario.

## Brechas declaradas

El smoke E2E de navegador tiene PASS en CI con Chromium, Firefox y WebKit, PostgreSQL temporal y nueve pruebas de perfiles. Aún faltan capturas cross-browser y medición JMeter. Tampoco se presentan como validadas por DPM las reglas de liderazgo, tarifas, recargos, autogestión ni otros supuestos empresariales. No se implementan facturación electrónica, nómina, pagos ni notificaciones automáticas.
