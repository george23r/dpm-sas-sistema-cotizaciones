# DPM S.A.S. — Sistema de cotizaciones y operaciones

Sistema web para gestionar cotizaciones individualizadas, programación de mantenimientos de zonas verdes, cuadrillas, órdenes, jornadas y reportes de DPM S.A.S.

## Estado real

El repositorio conserva la aplicación React/Vite existente y ahora incluye una API Express/TypeScript conectada a PostgreSQL mediante `pg` y cookies de sesión HttpOnly.

Implementado y probado con datos ficticios de desarrollo:

- Autenticación, sesión, roles y filtros de propiedad.
- Cotizaciones por visita técnica, líneas, costos internos, hitos, envío y respuesta del cliente.
- Órdenes desde cotizaciones aceptadas, agenda mensual/semanal/lista y asignación protegida por servidor.
- Clientes, zonas, trabajadores y cuadrillas con operaciones administrativas persistentes disponibles.
- Planillas de campo y administrativas, comparación, conciliación y bloqueo posterior.
- Reportes de periodo y portales diferenciados para administrador, cliente y operario.

Los datos del seed son ficticios. El dashboard no inventa métricas: muestra únicamente información devuelta por la API y estados informativos cuando no existe un dato.

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

Configura `VITE_API_URL` en el frontend y `DATABASE_URL`, `CORS_ORIGIN`, `SESSION_SECRET` y las demás variables de `backend/.env.example` en la API. No se guardan JWT ni credenciales en `localStorage`.

## Pruebas

```bash
npm run build
npm run lint
npm run test:unit

cd backend
npm run build
npm run lint
npm test
npm run test:integration
```

La integración se activa con `RUN_INTEGRATION=1` y una base PostgreSQL temporal. La evidencia reproducible está en [`docs/fase-3-4-evidencia-actualizacion-2026-11-08.md`](docs/fase-3-4-evidencia-actualizacion-2026-11-08.md). Las capturas de navegador se encuentran en [`evidencias/`](evidencias/).

## Base de datos

`database/01_schema.sql` elimina y recrea el esquema `dpm`; úsalo solo en una base local o temporal de desarrollo. Nunca lo ejecutes sobre una base con información que deba conservarse. `database/02_seed.sql` contiene datos ilustrativos y no representa tarifas ni políticas aprobadas por DPM.

## Alcance excluido

No se implementan facturación electrónica, nómina, pasarelas de pago, notificaciones automáticas ni fórmulas obligatorias de precios por área. La autogestión de clientes, tarifas, recargos y permisos empresariales específicos siguen sujetos a validación de DPM.

## Documentación

- [`backend/README.md`](backend/README.md): instalación, rutas y pruebas de API.
- [`docs/arquitectura/`](docs/arquitectura/): arquitectura y decisiones.
- [`docs/auditoria-fase-0.md`](docs/auditoria-fase-0.md): línea base y diferencias iniciales.
- [`BITACORA.md`](BITACORA.md): seguimiento del desarrollo.

## Autores

- Jorge Luis Ramos Perdomo
- Richard Esteban Sevillano Cuaran
