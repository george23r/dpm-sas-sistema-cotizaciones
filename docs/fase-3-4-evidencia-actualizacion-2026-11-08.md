# Evidencia adicional de fases 3 y 4

Fecha: 2026-11-08, America/Bogota.

## Integracion publicada

- El editor administrativo de cotizaciones usa la API en modo real y persiste cliente/zona, visita, lineas, costos internos, hitos y envio.
- La agenda real consulta ordenes/cuadrillas, permite vista mensual/lista, filtros, navegacion y asignacion desde panel lateral; el servidor conserva la decision sobre solapes.
- El portal cliente consulta sus zonas, crea solicitudes, lista y responde cotizaciones e historial de ordenes finalizadas mediante endpoints filtrados por propiedad.
- Clientes, trabajadores y servicios administrativos dejaron de usar semillas como fuente en modo real. Clientes y zonas ya cuentan con creación/edición persistente; no se crean cuentas de acceso automáticamente.
- La agenda real incorpora vistas mes, semana y lista con filtros, panel de detalle y asignación protegida por el servidor.

## Prueba HTTP contra PostgreSQL temporal

Base: `dpm_codex_test_20261108`; datos ficticios de desarrollo.

```text
POST /api/v1/auth/login       200
GET  /api/v1/clientes         200, 4 registros
GET  /api/v1/zonas            200, 12 registros
GET  /api/v1/servicios        200, 7 registros
GET  /api/v1/operarios        200, 12 registros
```

La comprobacion fue ejecutada con una sesion administrativa y origen permitido. No prueba propiedad de cliente porque no se promovieron credenciales reales.

## Prueba de integracion reproducible

Se anadio `backend/tests/integration.test.ts` y el script `npm run test:integration`. La prueba es opt-in y requiere una base temporal, credenciales ficticias y `RUN_INTEGRATION=1`; sin esas variables queda `SKIP`, no se presenta como PASS.

Ejecutada el 2026-11-08 contra `dpm_codex_test_20261108`:

```text
flujo integrado de cotizacion, orden y permisos: PASS
1 test, 0 fallos, 0 omitidos
```

El flujo comprobo login y `/auth/me`, propiedad de zonas, creacion de solicitud por cliente, rechazo de acceso administrativo por rol, visita, linea, costo privado, hito al 100 %, envio, ocultamiento de costos al cliente, aceptacion, creacion de orden desde cotizacion aceptada y consulta restringida de `/ordenes/mias` para operario.

La misma prueba tambien registro turnos en planilla de campo y administrativa, comparo el resultado `coincide`, concilio ambas planillas y verifico que un registro posterior fuera rechazado con `409` por planilla bloqueada.

También verificó `POST /clientes`, `POST /zonas`, `PATCH /zonas/:id`, `POST /cuadrillas`, `POST /operarios`, `PATCH /operarios/:id` y el rechazo `409` de un segundo líder activo, usando entidades ficticias aisladas en la base temporal.

## CI

Se publico `.github/workflows/validar-backend.yml` en `main`, commit `f5b0b3a`. El workflow levanta PostgreSQL 16, aplica esquema, seed y `03_consultas_comprobacion.sql`, y ejecuta build, lint y tests backend. Al momento de la revision el proveedor no mostro un estado de check asociado al commit.

## Brechas vigentes

- Falta validación empresarial de permisos de liderazgo; CRUD persistente de trabajadores y cuadrillas ya está disponible para administración y la restricción de líder único la aplica PostgreSQL.
- Falta completar mutaciones del portal operario y pruebas E2E de navegador.
- No se ejecutaron capturas cross-browser ni JMeter; no se declara PASS para RNF-03.
