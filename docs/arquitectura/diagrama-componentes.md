# Componentes, API y trazabilidad — DPM S.A.S.

Estado actualizado: 2026-11-08. Las rutas indicadas son las implementadas bajo `/api/v1`.

## 1. Componentes por módulo

| Módulo | Pantallas frontend | API principal | Persistencia |
|---|---|---|---|
| Acceso | Login y sesión | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | `usuarios` |
| Cotizaciones | Solicitar, mis cotizaciones, listado, editor y detalle | `/cotizaciones`, visitas, líneas, costos, hitos, enviar, respuesta | `cotizaciones`, `visitas_tecnicas`, `cotizacion_lineas`, `cotizacion_costos`, `cotizacion_hitos` |
| Programación | Agenda mes/semana/lista y panel de orden | `/ordenes`, filtros `estado`, `clienteId`, `cuadrillaId`, asignación | `ordenes_trabajo`, triggers de solape |
| Cuadrillas | Listado, edición, integrantes y asignaciones | `/cuadrillas`, `/cuadrillas/:id/miembros`, `/operarios` | `cuadrillas`, `operarios` |
| Ejecución | Mis órdenes y detalle móvil | `/ordenes/mias`, iniciar, finalizar | `ordenes_trabajo`, `v_ordenes_operario` |
| Historial | Servicios finalizados del cliente | `/clientes/:id/historial` | `v_historial_servicios` |
| Jornadas | Planillas, turnos, comparación y conciliación | `/planillas`, `/comparar`, `/conciliar` | `planillas_jornada`, `registros_jornada` |
| Reportes | Filtros por periodo/cliente, desglose y resumen operativo | `/reportes/periodo`, `/reportes/resumen` | `fn_reporte_periodo` y consultas agregadas parametrizadas |
| Catálogo | Servicios activos; administración de alta, edición y estado | `GET /servicios`; `POST/PATCH /servicios` solo administrador | `servicios` |

## 2. Autorización resumida

| Recurso | Administrador | Cliente | Operario |
|---|---:|---:|---:|
| Cotizaciones | Todas, edición previa al envío | Propias, conceptos y respuesta | No |
| Órdenes | Crear, consultar y asignar | Propias relacionadas | Solo cuadrilla propia |
| Cuadrillas y trabajadores | Administrar | No | No |
| Planillas y reportes | Administrar | No | No |
| Historial | Consultar | Propio | No |

La autorización se aplica en Express y PostgreSQL según corresponda; las rutas frontend no conceden privilegios.

## 3. Contratos implementados

- `POST /api/v1/cotizaciones` y `GET /api/v1/cotizaciones`/`:id`.
- `POST /api/v1/cotizaciones/:id/visitas`, `/lineas`, `/costos`, `/hitos`, `/enviar` y `/respuesta`.
- `POST /api/v1/ordenes`, `GET /api/v1/ordenes`, `GET /api/v1/ordenes/mias`, `GET /api/v1/ordenes/:id`, `PATCH /api/v1/ordenes/:id`, `/iniciar` y `/finalizar`.
- `GET/POST/PATCH /clientes`, `/zonas`, `/operarios`, `/cuadrillas` y `GET /servicios`.
- `POST/PATCH /servicios` solo para administradores; `incluirInactivos=true` también queda restringido a administración. No se exponen tarifas no confirmadas.
- `GET/POST /planillas`, `POST /planillas/:id/registros`, `GET /planillas/comparar` y `POST /planillas/conciliar`.
- `GET /api/v1/reportes/periodo` y `GET /api/v1/reportes/resumen` para el centro operativo.

El contrato OpenAPI está en `backend/openapi.yaml`. Las fechas de API son ISO; la interfaz presenta fechas en `America/Bogota` y valores monetarios en COP.

## 4. Reglas respaldadas por pruebas

| Historia | Regla o flujo | Evidencia |
|---|---|---|
| HU-01/HU-02 | Visita, líneas, hitos al 100 %, envío, vigencia y respuesta | integración API y C1–C4 |
| HU-03/HU-04 | Orden desde cotización aceptada, filtros, asignación y solapes | integración API, C5–C8 y E2E agenda |
| HU-05/HU-06/HU-07 | Propiedad de órdenes, iniciar/finalizar e historial | integración API, C9–C11 |
| HU-08 | Reporte por periodo y cliente | C15 e integración API |
| HU-09/HU-10 | Turnos, medianoche, comparación, conciliación y bloqueo | C12–C14 e integración API |

Las tarifas, recargos y permisos empresariales no se presentan como validados por DPM.

