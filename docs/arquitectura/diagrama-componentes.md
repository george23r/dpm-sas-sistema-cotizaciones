# Componentes, API y trazabilidad â€” DPM S.A.S.

Estado actualizado: 2026-11-08. Las rutas indicadas son las implementadas bajo `/api/v1`.

## 1. Componentes por mÃ³dulo

| MÃ³dulo | Pantallas frontend | API principal | Persistencia |
|---|---|---|---|
| Acceso | Login y sesiÃ³n | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | `usuarios` |
| Cotizaciones | Solicitar, mis cotizaciones, listado, editor y detalle | `/cotizaciones`, visitas, lÃ­neas, costos, hitos, enviar, respuesta | `cotizaciones`, `visitas_tecnicas`, `cotizacion_lineas`, `cotizacion_costos`, `cotizacion_hitos` |
| ProgramaciÃ³n | Agenda mes/semana/lista y panel de orden | `/ordenes`, filtros `estado`, `clienteId`, `cuadrillaId`, asignaciÃ³n | `ordenes_trabajo`, triggers de solape |
| Cuadrillas | Listado, ediciÃ³n, integrantes y asignaciones | `/cuadrillas`, `/cuadrillas/:id/miembros`, `/operarios` | `cuadrillas`, `operarios` |
| EjecuciÃ³n | Mis Ã³rdenes y detalle mÃ³vil | `/ordenes/mias`, iniciar, finalizar | `ordenes_trabajo`, `v_ordenes_operario` |
| Historial | Servicios finalizados del cliente | `/clientes/:id/historial` | `v_historial_servicios` |
| Jornadas | Planillas, turnos, comparaciÃ³n y conciliaciÃ³n | `/planillas`, `/comparar`, `/conciliar` | `planillas_jornada`, `registros_jornada` |
| Reportes | Filtros por periodo/cliente y desglose | `/reportes/periodo` | `fn_reporte_periodo` |
| CatÃ¡logo | Servicios activos sin tarifas no confirmadas | `/servicios` | `servicios` |

## 2. AutorizaciÃ³n resumida

| Recurso | Administrador | Cliente | Operario |
|---|---:|---:|---:|
| Cotizaciones | Todas, ediciÃ³n previa al envÃ­o | Propias, conceptos y respuesta | No |
| Ã“rdenes | Crear, consultar y asignar | Propias relacionadas | Solo cuadrilla propia |
| Cuadrillas y trabajadores | Administrar | No | No |
| Planillas y reportes | Administrar | No | No |
| Historial | Consultar | Propio | No |

La autorizaciÃ³n se aplica en Express y PostgreSQL segÃºn corresponda; las rutas frontend no conceden privilegios.

## 3. Contratos implementados

- `POST /api/v1/cotizaciones` y `GET /api/v1/cotizaciones`/`:id`.
- `POST /api/v1/cotizaciones/:id/visitas`, `/lineas`, `/costos`, `/hitos`, `/enviar` y `/respuesta`.
- `POST /api/v1/ordenes`, `GET /api/v1/ordenes`, `GET /api/v1/ordenes/mias`, `GET /api/v1/ordenes/:id`, `PATCH /api/v1/ordenes/:id`, `/iniciar` y `/finalizar`.
- `GET/POST/PATCH /clientes`, `/zonas`, `/operarios`, `/cuadrillas` y `GET /servicios`.
- `GET/POST /planillas`, `POST /planillas/:id/registros`, `GET /planillas/comparar` y `POST /planillas/conciliar`.
- `GET /api/v1/reportes/periodo`.

El contrato OpenAPI estÃ¡ en `backend/openapi.yaml`. Las fechas de API son ISO; la interfaz presenta fechas en `America/Bogota` y valores monetarios en COP.

## 4. Reglas respaldadas por pruebas

| Historia | Regla o flujo | Evidencia |
|---|---|---|
| HU-01/HU-02 | Visita, lÃ­neas, hitos al 100 %, envÃ­o, vigencia y respuesta | integraciÃ³n API y C1â€“C4 |
| HU-03/HU-04 | Orden desde cotizaciÃ³n aceptada, filtros, asignaciÃ³n y solapes | integraciÃ³n API, C5â€“C8 y E2E agenda |
| HU-05/HU-06/HU-07 | Propiedad de Ã³rdenes, iniciar/finalizar e historial | integraciÃ³n API, C9â€“C11 |
| HU-08 | Reporte por periodo y cliente | C15 e integraciÃ³n API |
| HU-09/HU-10 | Turnos, medianoche, comparaciÃ³n, conciliaciÃ³n y bloqueo | C12â€“C14 e integraciÃ³n API |

Las tarifas, recargos y permisos empresariales no se presentan como validados por DPM.

