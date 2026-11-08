# Evidencia de navegador

Fecha: 2026-11-08, America/Bogota. Entorno: Vite local, API Express local y PostgreSQL 16 temporal `dpm_codex_test_20261108`. Datos ficticios.

## Flujos observados

- Administrador: login real mediante cookie HttpOnly, panel operativo y editor de cotización persistente.
- Cliente: login real, consulta de zonas propias desde `/api/v1/zonas`, navegación del portal y acciones de solicitud/respuesta disponibles.
- Operario: login real, consulta filtrada de órdenes de su cuadrilla, inicio y finalización de la orden `12` con nota. La consulta SQL posterior devolvió `12|finalizada|Prueba de cierre en entorno temporal.`
- Seguridad de propiedad: la lista de órdenes es filtrada por el servidor según cliente u operario autenticado; la UI no se usa como autorización.

## Capturas

- `evidencias/dashboard-admin-1366-2026-11-08.png`
- `evidencias/dashboard-admin-360-2026-11-08.png`
- `evidencias/editor-cotizacion-1366-2026-11-08.png`
- `evidencias/portal-cliente-360-2026-11-08.png`
- `evidencias/portal-operario-360-2026-11-08.png`
- `evidencias/operario-finalizacion-360-2026-11-08.png`

## Incidencia corregida

La respuesta de iniciar/finalizar orden contiene campos parciales. La UI reemplazaba el objeto completo y luego intentaba leer fecha/hora ausentes. Se corrigió fusionando la respuesta parcial con la orden cargada; el flujo fue repetido y terminó con estado `finalizada` persistido.

## Limitaciones

Las capturas son evidencia local con datos ficticios y no equivalen a validación de DPM. No se declara todavía cobertura completa de Chrome/Edge/Firefox, Safari iOS ni rendimiento JMeter.
