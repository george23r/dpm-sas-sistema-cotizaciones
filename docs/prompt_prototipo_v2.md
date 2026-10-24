# Prompt para la versión 2 del prototipo (ajustes y pantallas pendientes)

Pegar en la herramienta con la que se generó el prototipo, sobre el proyecto existente. Mantiene el diseño actual (colores, tipografía, navegación y selector "Ver como") y hace solo estos cambios.

```
Actualiza el prototipo de "DPM SAS — Gestión de Zonas Verdes" (React + TypeScript, datos simulados). Mantén el diseño, los colores, la tipografía y el selector "Ver como". Aplica SOLO estos cambios, en español y con pesos colombianos:

AJUSTES A PANTALLAS EXISTENTES
1. Administrador > "Nueva cotización" (HU-01): reemplaza el formulario de área, vegetación y frecuencia por una cotización por LÍNEAS. Campos: cliente, zona, objeto de la cotización, fecha de la visita técnica (obligatoria), y una tabla editable de líneas con concepto, cantidad, valor unitario y valor total (cantidad × valor unitario). Debajo, una sección "Forma de pago" con hitos (descripción y porcentaje) que deben sumar 100 % (muestra un aviso si no suman). Un panel "Resumen" muestra el total (suma de líneas) y la vigencia (15 días). Botones "Guardar borrador" y "Enviar cotización" (deshabilitado si falta la visita técnica, las líneas o los hitos no suman 100 %). Agrega una sección plegable "Análisis interno de costos (no lo ve el cliente)" con tipo (mano de obra, maquinaria, herramientas, combustible, transporte), cantidad y valor unitario.
2. Administrador > "Cotizaciones": quita el diálogo de cálculo por área y factores; "Calcular y enviar" pasa a "Elaborar cotización". Estados: solicitada, borrador, enviada, aceptada, rechazada. Muestra el consecutivo (COT-0001) y la fecha de vencimiento.
3. Cliente > "Mis cotizaciones": estados solicitada, enviada, aceptada, rechazada; muestra el consecutivo, el total y "vence el ...". Botones Aceptar y Rechazar solo si está enviada y vigente.
4. Cliente > "Solicitar cotización": campos zona, servicio requerido (lista de 7: poda de árboles, resiembra con macollo, resiembra con semilla, control de limpieza manual, rectificación de encalle manual, riego en situaciones de sequía, fumigación manual) y observaciones. Sin área, vegetación ni frecuencia.
5. Cliente > "Historial de servicios": muestra SOLO servicios finalizados.
6. Quita el estado "Incidencia" de todas las pantallas (panel, programación y cuadrillas). Los estados de una orden son: pendiente, en ejecución y finalizada.

PANTALLAS NUEVAS (administrador, mismo menú lateral)
7. "Jornadas" (HU-09): lista de planillas por cliente y periodo con origen (campo o administrativa) y estado (borrador, en comparación, conciliada). Al abrir una planilla: tabla de registros con fecha, trabajador, lote, actividad, labor, hora de inicio, hora de fin, descanso, horas (calculadas; un turno de 18:00 a 06:00 muestra 12 h) y casilla dominical/festivo.
8. "Comparar planillas" (HU-10): elige la planilla de campo y la administrativa; tabla con trabajador, fecha, horas de campo, horas administrativas y resultado (coincide en verde, diferente en rojo, solo campo y solo administrativa en amarillo). Botón "Conciliar" deshabilitado mientras existan diferencias.
9. "Reportes" (HU-08): filtros de fecha y cliente; tabla con cotizaciones solicitadas y aceptadas, valor aceptado, servicios finalizados y horas registradas.
10. "Clientes": lista con nombre, tipo (residencial, comercial, institucional, agrícola) y zonas, y formulario para crear un cliente.
11. "Cuadrillas y operarios": lista de cuadrillas con sus integrantes y líder, y formulario para agregar operarios.
12. "Servicios y parámetros": catálogo de servicios con su unidad de cobro (por árbol, por m², por jornada, global).

DATOS SIMULADOS: nombres genéricos e inventados (por ejemplo "Hacienda Ejemplo"), valores ilustrativos; no uses datos reales.
Mantén en cada pantalla la etiqueta pequeña con la historia de usuario que cubre.
```
