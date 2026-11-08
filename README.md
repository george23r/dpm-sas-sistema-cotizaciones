# DPM S.A.S. â€” Sistema de cotizaciones y operaciones

Sistema web para gestionar cotizaciones individualizadas, programaciÃ³n de mantenimientos de zonas verdes, cuadrillas, Ã³rdenes, jornadas y reportes de DPM S.A.S.

## Estado real

El repositorio conserva la aplicaciÃ³n React/Vite existente y ahora incluye una API Express/TypeScript conectada a PostgreSQL mediante `pg` y cookies de sesiÃ³n HttpOnly.

Implementado y probado con datos ficticios de desarrollo:

- AutenticaciÃ³n, sesiÃ³n, roles y filtros de propiedad.
- Cotizaciones por visita tÃ©cnica, lÃ­neas, costos internos, hitos, envÃ­o y respuesta del cliente.
- Ã“rdenes desde cotizaciones aceptadas, agenda mensual/semanal/lista y asignaciÃ³n protegida por servidor.
- Clientes, zonas, trabajadores y cuadrillas con operaciones administrativas persistentes disponibles.
- Planillas de campo y administrativas, comparaciÃ³n, conciliaciÃ³n y bloqueo posterior.
- Reportes de periodo y portales diferenciados para administrador, cliente y operario.

Los datos del seed son ficticios. El dashboard no inventa mÃ©tricas: muestra Ãºnicamente informaciÃ³n devuelta por la API y estados informativos cuando no existe un dato.

## Ejecutar

Frontend:

```bash
npm ci
npm run dev
```

Backend:

```bash
cd backend
npm ci
Copy-Item .env.example .env
npm run build
npm run dev
```

Configura `VITE_API_URL` en el frontend y `DATABASE_URL`, `CORS_ORIGIN`, `SESSION_SECRET` y las demÃ¡s variables de `backend/.env.example` en la API. No se guardan JWT ni credenciales en `localStorage`.

## Pruebas

```bash
npm run build
npm run lint
npm run test:unit
npm run test:e2e

cd backend
npm run build
npm run lint
npm test
npm run test:integration
```

La integraciÃ³n se activa con `RUN_INTEGRATION=1` y una base PostgreSQL temporal. El E2E requiere una API y PostgreSQL disponibles; en CI lo ejecuta `.github/workflows/validar-e2e.yml` con Chromium y `database/04_seed_e2e.sql`. La evidencia reproducible estÃ¡ en [`docs/fase-3-4-evidencia-actualizacion-2026-11-08.md`](docs/fase-3-4-evidencia-actualizacion-2026-11-08.md). Las capturas de navegador se encuentran en [`evidencias/`](evidencias/).

## Base de datos

`database/01_schema.sql` elimina y recrea el esquema `dpm`; Ãºsalo solo en una base local o temporal de desarrollo. Nunca lo ejecutes sobre una base con informaciÃ³n que deba conservarse. `database/02_seed.sql` contiene datos ilustrativos y no representa tarifas ni polÃ­ticas aprobadas por DPM.

## Alcance excluido

No se implementan facturaciÃ³n electrÃ³nica, nÃ³mina, pasarelas de pago, notificaciones automÃ¡ticas ni fÃ³rmulas obligatorias de precios por Ã¡rea. La autogestiÃ³n de clientes, tarifas, recargos y permisos empresariales especÃ­ficos siguen sujetos a validaciÃ³n de DPM.

## DocumentaciÃ³n

- [`backend/README.md`](backend/README.md): instalaciÃ³n, rutas y pruebas de API.
- [`docs/arquitectura/`](docs/arquitectura/): arquitectura y decisiones.
- [`docs/auditoria-fase-0.md`](docs/auditoria-fase-0.md): lÃ­nea base y diferencias iniciales.
- [`BITACORA.md`](BITACORA.md): seguimiento del desarrollo.

## Autores

- Jorge Luis Ramos Perdomo
- Richard Esteban Sevillano Cuaran

