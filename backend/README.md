# API DPM S.A.S.

Backend Node.js + Express + TypeScript para integrar gradualmente el frontend React con PostgreSQL. Incluye infraestructura, autenticación real y el primer tramo persistente de HU-01/HU-02.

## Desarrollo local

1. Instala PostgreSQL 16 o inicia una base dedicada.
2. Copia `.env.example` a `.env` y define una `DATABASE_URL` real. La API no debe conectarse como superusuario en un entorno compartido.
3. En una base desechable, aplica el esquema y seed ficticios:

```bash
psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f ../database/01_schema.sql
psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f ../database/02_seed.sql
```

`01_schema.sql` borra y recrea `dpm`; nunca se debe ejecutar sobre producción. Los hashes de `02_seed.sql` son marcadores y no permiten iniciar sesión como usuarios reales.

```bash
npm ci
npm run build
npm test
npm run lint
npm start
```

## Rutas implementadas

- `GET /health`: respuesta pública mínima sin detalles internos.
- `GET /ready`: comprueba PostgreSQL sin requerir sesión y devuelve 503 si no está disponible.
- `POST /api/v1/auth/login`: valida correo/clave y crea cookie HttpOnly.
- `GET /api/v1/auth/me`: valida cookie, consulta de nuevo `dpm.usuarios` y devuelve el usuario actual.
- `POST /api/v1/auth/logout`: limpia la cookie.
- `GET /api/v1/cotizaciones`: lista cotizaciones filtradas por rol y propiedad.
- `POST /api/v1/cotizaciones`: crea una solicitud del cliente autenticado o una cotización administrativa.
- `GET /api/v1/cotizaciones/:id`: devuelve el detalle; los costos internos solo aparecen para administración.
- `POST /api/v1/cotizaciones/:id/visitas`, `/lineas`, `/costos`, `/hitos`: completa una cotización como administración.
- `POST /api/v1/cotizaciones/:id/enviar`: ejecuta `dpm.sp_enviar_cotizacion`.
- `POST /api/v1/cotizaciones/:id/respuesta`: ejecuta `dpm.sp_responder_cotizacion` para el cliente propietario.
- `GET/POST /api/v1/ordenes`, `GET/PATCH /api/v1/ordenes/:id`: programación y asignación; creación solo desde cotización aceptada.
- `PATCH /api/v1/ordenes/:id/iniciar` y `/finalizar`: acciones del operario de la cuadrilla asignada.
- `GET /api/v1/cuadrillas` y `/api/v1/cuadrillas/:id/miembros`: capacidad e integrantes registrados para administración.
- `GET/POST /api/v1/planillas`, `POST /api/v1/planillas/:id/registros`: planillas y jornadas.
- `GET /api/v1/planillas/comparar` y `POST /api/v1/planillas/conciliar`: comparación y conciliación mediante funciones/procedimientos SQL.
- `GET /api/v1/reportes/periodo`: reporte HU-08 mediante `dpm.fn_reporte_periodo`.
- `GET /api/v1/clientes`: catálogo de clientes para administración.
- `GET /api/v1/zonas?clienteId=`: zonas visibles según rol y propiedad.
- `GET /api/v1/servicios`: catálogo activo; no expone tarifas ficticias.
- `GET /api/v1/operarios`: trabajadores activos/inactivos y carga próxima para administración.

La cookie no se expone al navegador mediante JavaScript. En producción se requiere HTTPS, `COOKIE_SAMESITE=none` únicamente si la separación de orígenes lo exige y `DB_SSL=true` con certificado verificable. El backend nunca devuelve `password_hash`.

## Estado de alcance

Implementado y probado: autenticación contra `dpm.usuarios`, cookies HttpOnly, roles, `/health`, `/ready`, cotizaciones por líneas/visita/costos/hitos, órdenes, cuadrillas, planillas, comparación/conciliación y reportes mediante los procedimientos/funciones existentes. Pendiente: CRUD de apoyo completo, conexión de los portales de cliente/operario a todas sus mutaciones y pruebas E2E de navegador.

La base temporal de integración se ejecutó con PostgreSQL 16 y los 27 checks de `03_consultas_comprobacion.sql` pasaron. La base persistida local no se usa como evidencia limpia porque ya tenía datos modificados y una comprobación falló por falta de visita en una cotización existente.
