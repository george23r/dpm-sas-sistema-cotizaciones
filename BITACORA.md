# Bitácora de trabajo

## 2026-09-17 — Jorge y Richard: se creó el repositorio, se definió el Product Backlog inicial (HU-01 a HU-08), se configuró la nomenclatura de ramas por historia de usuario y se subió el primer commit con README.md, BITACORA.md y el documento de trabajo de grado en /docs.

## 2026-10-24 — Corte 2, actualización de diseño (registrado con base en entregables)

- Se incorporaron en GitHub los scripts PostgreSQL v2, 14 tablas, diccionario y resultados entregados de 18 pruebas / 27 comprobaciones.
- Se actualizaron arquitectura, componentes/API y decisiones técnicas conforme a la entrevista real de DPM. Las decisiones pendientes se diferencian de los requisitos validados.
- Se abrieron los issues [HU-09](https://github.com/george23r/dpm-sas-sistema-cotizaciones/issues/3) y [HU-10](https://github.com/george23r/dpm-sas-sistema-cotizaciones/issues/4) para la implementación de registro de jornadas y conciliación de planillas.
- Se redactó el Sprint Backlog del diseño y una lista de validaciones pendientes. No se registran sesiones ni revisiones que no estén respaldadas.
- Se revisó en archivo local el Word del corte 2, se regeneraron índices y se extrajeron los ocho diagramas incrustados para su publicación. Subida de binarios por completar.

## 2026-10-24 — Prototipo HU-09/HU-10
- Se añadió la vista de jornadas y comparación de planillas con datos ficticios de demostración. El resto del flujo de cotización todavía requiere ajuste; esto no constituye integración con PostgreSQL ni API.


## 2026-10-24 — Prototipo HU-01/HU-02 (rama de desarrollo)
- Se reemplazó el cálculo de cotizaciones por área/frecuencia por líneas, visita técnica, costos internos y hitos de pago (suma 100 %).
- Se adaptaron los estados `solicitada`, `borrador`, `enviada`, `aceptada`, `rechazada`, la vigencia de 15 días y la solicitud del cliente.
- Se retiró el estado demostrativo `incidencia` del prototipo y se restringió el historial a órdenes finalizadas según la decisión académica actual.
- Datos en memoria; la API Express y PostgreSQL aún no están conectados. Pendiente ejecutar build y pruebas de navegación; las tarifas siguen siendo ilustrativas.

## 2026-10-24 — HU-03 y HU-08, prototipo de diseño
- Se limitaron nuevas órdenes a cotizaciones aceptadas, se validan zona/cliente y horarios, se evitan cruces por cuadrilla.
- Se creó una pantalla de reporte de cotizaciones aceptadas y servicios finalizados con filtros de cliente y periodo.
- No se conecta aún a PostgreSQL ni se simulan cifras verificadas de DPM; los registros continúan ficticios.

## 2026-10-24 — Integración de HU-09/HU-10 con HU-08
- Se trasladaron las planillas de campo y administrativas al AppContext compartido.
- Se agregó registro de jornadas por cliente/periodo, validaciones de zona, horas nocturnas, descanso y registros repetidos.
- Se incorporó la comparación por trabajador y fecha y la conciliación solo cuando ambas planillas coinciden; las conciliadas se bloquean.
- El reporte HU-08 muestra horas de campo, pares conciliados y diferencias para el periodo y cliente filtrados.
- Build de GitHub Actions superado en la rama; son pantallas de prototipo con datos ficticios, no API ni conexión PostgreSQL.


## 2026-10-24 — Cierre técnico preliminar del prototipo
- Se añadieron pantallas administrativas para crear y editar clientes y trabajadores ficticios, con validaciones de nombre, correo, teléfono, cuadrilla y un líder activo.
- Se conectaron al AppContext para reflejar nuevos clientes en las consultas; no hay persistencia ni credenciales reales.
- Se añadieron doce casos unitarios reproducibles y una matriz de aceptación visual de HU-01 a HU-10.
- El flujo de GitHub Actions ejecuta build y pruebas unitarias; falta documentar ejecuciones manuales en navegador y consultar decisiones de DPM y dirección académica.
