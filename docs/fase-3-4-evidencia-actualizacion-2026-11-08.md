# Evidencia adicional de fases 3 y 4

Fecha: 2026-11-08, America/Bogota.

## Integracion publicada

- El editor administrativo de cotizaciones usa la API en modo real y persiste cliente/zona, visita, lineas, costos internos, hitos y envio.
- La agenda real consulta ordenes/cuadrillas, permite vista mensual/semanal/lista, filtros, navegacion y asignacion desde panel lateral; el servidor conserva la decision sobre solapes.
- El portal cliente consulta sus zonas, crea solicitudes, lista y responde cotizaciones e historial de ordenes finalizadas mediante endpoints filtrados por propiedad.
- Clientes, trabajadores y servicios administrativos dejaron de usar semillas como fuente en modo real. Clientes y zonas ya cuentan con creaciÃ³n/ediciÃ³n persistente; no se crean cuentas de acceso automÃ¡ticamente.
- La agenda real incorpora vistas mes, semana y lista con filtros, panel de detalle y asignaciÃ³n protegida por el servidor.

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

En el commit `1fa9309` se agrego una regresion para HU-03: una segunda creacion de orden con la misma cotizacion aceptada devuelve `409 QUOTE_ALREADY_SCHEDULED`. La implementacion usa una transaccion y `pg_advisory_xact_lock` para que la regla tambien sea segura ante concurrencia. El workflow backend `42524997142` termino `success` contra PostgreSQL 16 temporal.

TambiÃ©n verificÃ³ `POST /clientes`, `POST /zonas`, `PATCH /zonas/:id`, `POST /cuadrillas`, `POST /operarios`, `PATCH /operarios/:id` y el rechazo `409` de un segundo lÃ­der activo, usando entidades ficticias aisladas en la base temporal.

## Evidencia de navegador local

Ejecutada el 2026-11-08 con Vite, Express y PostgreSQL temporal, Chromium controlado por Playwright, sesiÃ³n real mediante cookie HttpOnly y datos ficticios de desarrollo:

- Administrador: login, panel operativo, clientes, trabajadores, cuadrillas, programaciÃ³n mensual/semanal y reportes a 1366 px.
- Cliente: portal de zonas a 360 px.
- Operario: portal de Ã³rdenes a 360 px.
- La vista de jornadas fue revisada despuÃ©s de corregir el uso de IDs demo `NaN`; posteriormente cargÃ³ clientes reales desde `GET /api/v1/clientes` sin claves duplicadas.

Capturas versionadas en `evidencias/`: `e2e-dashboard-admin-1366-2026-11-08.png`, `e2e-clientes-1366-2026-11-08.png`, `e2e-trabajadores-1366-2026-11-08.png`, `e2e-cuadrillas-1366-2026-11-08.png`, `e2e-programacion-1366-2026-11-08.png`, `e2e-programacion-semana-1366-2026-11-08.png`, `e2e-jornadas-1366-2026-11-08.png`, `e2e-reportes-1366-2026-11-08.png`, `e2e-portal-cliente-360-2026-11-08.png` y `e2e-portal-operario-360-2026-11-08.png`.

## CI

Se publico `.github/workflows/validar-backend.yml` en `main`. Para el commit `a331c57`, el workflow `Verificar API y PostgreSQL` termino `success` en la ejecucion `42523408817`; levanto PostgreSQL 16, aplico esquema, seed y `03_consultas_comprobacion.sql`, y ejecuto build, lint y tests backend.

Tambien se agrego `.github/workflows/validar-e2e.yml`, `playwright.config.ts`, `e2e/roles.spec.ts` y `database/04_seed_e2e.sql`. El arnes actual contiene ocho escenarios funcionales; la ejecucion completa local produce 24 casos entre Chromium, Firefox y WebKit, con el escenario mutativo del operario omitido en Firefox y WebKit para no repetir cambios persistentes. La ejecucion CI historica termino `success` contra PostgreSQL temporal y Chromium; la evidencia vigente esta en `docs/evidencia-operario-ejecucion-2026-11-08.md`.

## Brechas vigentes

- Falta validaciÃ³n empresarial de permisos de liderazgo; CRUD persistente de trabajadores y cuadrillas ya estÃ¡ disponible para administraciÃ³n y la restricciÃ³n de lÃ­der Ãºnico la aplica PostgreSQL.
- Falta completar mutaciones adicionales del portal operario; el smoke E2E de login, aislamiento por rol y navegacion de los tres perfiles ya tiene PASS en CI con Chromium.
- Las capturas cross-browser representativas ya se generaron para Chromium, Firefox y WebKit; se mantienen como evidencia local en `evidencias/cross-browser-*.png`. RNF-03 cuenta con una mediciÃ³n local documentada en `performance/evidencia-2026-11-08.md`: 2.010 muestras, 0 errores y P95 de 4â€“5 ms para las cuatro operaciones de consulta. El resultado usa PostgreSQL 16 aislado, datos ficticios y no constituye un SLA de producciÃ³n.

### Correccion de rate limit y E2E multiplataforma

En la ejecucion inicial de tres navegadores se reprodujo un fallo porque el rate limit estaba aplicado a todo `/auth`, incluyendo `GET /me`; no era un fallo de credenciales ni de compatibilidad del navegador. El commit `ea44d72` dejo el limite exclusivamente en `POST /auth/login`, manteniendo la proteccion contra fuerza bruta sin bloquear la renovacion normal de sesion.

La ejecucion CI `42524261979` termino `success` con 9 pruebas: 3 en Chromium, 3 en Firefox y 3 en WebKit. La ausencia de `psql` continua siendo una limitacion para repetir localmente el arranque de PostgreSQL.

## MediciÃ³n RNF-03

Se ejecutÃ³ Apache JMeter 5.6.3 contra la API Express compilada y un contenedor PostgreSQL 16 aislado. El escenario usÃ³ 10 usuarios concurrentes, login por cookie HttpOnly y 50 iteraciones por cada consulta. Las operaciones de cotizaciones, historial operativo, reporte de periodo y comparaciÃ³n de planillas obtuvieron 500 muestras cada una, 0 errores y P95 de 4, 4, 5 y 4 ms respectivamente. Se conservaron el JTL y `statistics.json` en `performance/evidencia-2026-11-08/`.
## Evidencia cross-browser local

La prueba local del 2026-11-08 se repitiÃƒÂ³ con 9 casos: 3 en Chromium, 3 en Firefox y 3 en WebKit. Resultado: `9 passed` en 31,5 segundos, contra Vite, Express y PostgreSQL temporal con cookie HttpOnly. Se generaron capturas de panel y programaciÃ³n administrativa, portal cliente a 360 px y portal operario a 360 px para cada motor en `evidencias/cross-browser-*.png`.

La captura cubre evidencia representativa de los tres perfiles; no sustituye una auditorÃ­a completa de todas las pantallas ni una validaciÃ³n empresarial.
## Flujo integrado ampliado

La prueba `backend/tests/integration.test.ts` se ejecutÃ³ nuevamente el 2026-11-08 contra PostgreSQL 16 aislado. Resultado: `1 passed`, `0 failed`, `0 skipped`. AdemÃ¡s del flujo de cotizaciÃ³n, aceptaciÃ³n, programaciÃ³n y planillas, verificÃ³ inicio y finalizaciÃ³n de la orden por el operario, rechazo de cierre duplicado (`409`), historial del cliente con el servicio finalizado, reporte de periodo para administraciÃ³n y rechazo de acceso del cliente al reporte (`403`).
## Endurecimiento de propiedad y errores de negocio

La API ahora verifica que la zona de una cotizaciÃ³n pertenezca al cliente autenticado o al cliente seleccionado por administraciÃ³n. La prueba integrada confirmÃ³ el rechazo `403 ZONE_NOT_OWNED` para una zona ajena. TambiÃ©n se mapearon las restricciones de envÃ­o y respuesta de cotizaciones a errores HTTP `409` controlados, manteniendo las validaciones definitivas en PostgreSQL.
## Contraejemplos API verificados

La integraciÃ³n ampliada ejecutada contra PostgreSQL 16 aislado verificÃ³: envÃ­o sin visita (`409 QUOTE_SEND_BLOCKED`), hitos que no suman 100 % (`409`), ediciÃ³n posterior al envÃ­o (`409 QUOTE_IMMUTABLE`), doble programaciÃ³n por solape de cuadrilla (`409 BUSINESS_RULE`) y conciliaciÃƒÂ³n con diferencias (`409 RECONCILIATION_BLOCKED`). El caso completo terminÃ³ `1 passed`, `0 failed`, `0 skipped`.
## ActualizaciÃ³n posterior de conteo y validaciÃ³n de planillas

La suite actual de `e2e/roles.spec.ts` contiene ocho escenarios funcionales y se ejecuta en tres proyectos; por eso una corrida completa produce 24 casos (`8 Chromium + 8 Firefox + 8 WebKit`), con dos omisiones intencionales del escenario mutativo (`Firefox` y `WebKit`). Las referencias histÃ³ricas de nueve, 18 y 21 casos corresponden a versiones anteriores del arnÃ©s.

El 2026-11-08 se aÃ±adiÃ³ la validaciÃ³n HTTP de pares de planillas. `GET /api/v1/planillas/comparar` rechaza con `409 PLANILLA_PAIR_INVALID` los identificadores que no corresponden al mismo cliente, periodo y orÃ­genes campo/administrativa. La evidencia reproducible estÃ¡ en `docs/evidencia-planillas-validacion-2026-11-08.md`.

## EvaluaciÃ³n de FullCalendar

Se revisÃ³ la alternativa FullCalendar React para las vistas gratuitas `dayGrid`, `timeGrid` y `list`. La implementaciÃ³n vigente conserva componentes propios en `src/pages/admin/ProgramacionApiView.tsx`, porque ya cubren mes/semana/lista, navegaciÃ³n, filtros, detalle lateral y fechas America/Bogota sin aÃ±adir una dependencia de licencia ni requerir vistas de recursos Premium. La disponibilidad y los solapes continÃºan siendo responsabilidad del servidor y PostgreSQL; esta decisiÃ³n puede revisarse si el volumen operativo justifica incorporar la dependencia.

## EjecuciÃ³n de orden por operario

Se agregÃ³ el escenario E2E mutativo para iniciar una orden, registrar una nota y finalizarla mediante la API real desde el portal mobile-first. En una base temporal limpia (`dpm_codex_test_20261108`) la suite completa produjo `22 passed`, `2 skipped`, `0 failed`; el escenario mutativo se ejecuta solo en Chromium para no repetir el cambio persistente en Firefox y WebKit. La evidencia detallada estÃ¡ en `docs/evidencia-operario-ejecucion-2026-11-08.md`.

## Detalle de cotizaciones en frontend real

Se incorporÃ³ `src/pages/CotizacionDetalle.tsx` y las rutas de detalle para administraciÃ³n y cliente. La vista consulta `GET /api/v1/cotizaciones/:id`, muestra lÃƒÂ­neas, visita, hitos y vigencia; los costos internos solo se renderizan para administraciÃ³n y el cliente puede responder Ãºnicamente cuando la API y la vigencia lo permiten. La prueba E2E local se ejecutÃ³ con 9 casos: `9 passed` en Chromium, Firefox y WebKit; la vista de detalle fue comprobada para ambos roles.

