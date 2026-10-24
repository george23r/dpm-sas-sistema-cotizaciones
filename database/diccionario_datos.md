# Diccionario de datos — DPM SAS

Base de datos PostgreSQL, esquema `dpm`, versión 2. Generado a partir del catálogo de la base de datos (`01_schema.sql`).

**Resumen:** 14 tablas, 109 columnas.

## 1. `usuarios`

Cuentas de acceso al sistema. Cada persona que ingresa (administrador, cliente u operario) tiene un usuario con un rol.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único del usuario. |
| `nombre` | varchar(120) | No |  | Nombre completo de la persona. |
| `correo` | varchar(160) | No |  | Correo para iniciar sesión; es único sin distinguir mayúsculas. |
| `password_hash` | varchar(255) | No |  | Contraseña almacenada como hash, nunca en texto plano (RNF-02). |
| `rol` | rol_usuario | No | UQ | Perfil de acceso: administrador, cliente u operario (RNF-04). |
| `activo` | boolean | No |  | Indica si la cuenta puede iniciar sesión; se desactiva en lugar de borrar. (por defecto: `true`) |
| `creado_en` | timestamptz | No |  | Fecha y hora de creación de la cuenta. (por defecto: `now()`) |

**Reglas de integridad (CHECK):**

- `ck_usuarios_correo`: `CHECK (((correo)::text ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'::text))`

## 2. `clientes`

Contratantes de DPM SAS (haciendas, conjuntos, empresas, colegios). Pueden tener o no una cuenta de usuario.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único del cliente. |
| `usuario_id` | integer | Sí | FK → usuarios.id, UQ | Cuenta de usuario del cliente (opcional); debe tener rol cliente. |
| `rol_usuario` | rol_usuario | No | FK → usuarios.rol | Columna técnica fija en "cliente"; permite validar el rol del usuario con una llave foránea compuesta. (por defecto: `'cliente'::rol_usuario`) |
| `nombre` | varchar(150) | No | UQ | Nombre o razón social; es único. |
| `nit` | varchar(20) | Sí |  | NIT del cliente (opcional); es único cuando existe. |
| `tipo` | tipo_cliente | No |  | Clasificación: residencial, comercial, institucional o agrícola. |
| `telefono` | varchar(30) | Sí |  | Teléfono de contacto. |
| `correo_contacto` | varchar(160) | Sí |  | Correo de contacto del cliente. |
| `creado_en` | timestamptz | No |  | Fecha y hora de registro del cliente. (por defecto: `now()`) |

**Reglas de integridad (CHECK):**

- `ck_clientes_rol`: `CHECK ((rol_usuario = 'cliente'::rol_usuario))`

## 3. `servicios`

Catálogo de los servicios que ofrece DPM SAS (poda de árboles, resiembra, riego, fumigación, etc.).

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | smallint | No | PK | Identificador único del servicio. |
| `nombre` | varchar(100) | No | UQ | Nombre del servicio; es único. |
| `unidad_cobro` | varchar(30) | No |  | Unidad en que se cobra el servicio (árbol, m², jornada, global); por confirmar con DPM SAS. |
| `activo` | boolean | No |  | Indica si el servicio está disponible para nuevas cotizaciones. (por defecto: `true`) |

## 4. `zonas`

Sitios de trabajo de cada cliente: predios, zonas verdes o lotes.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único de la zona. |
| `cliente_id` | integer | No | FK → clientes.id, UQ | Cliente al que pertenece la zona. |
| `nombre` | varchar(120) | No | UQ | Nombre de la zona o lote; es único dentro de cada cliente. |
| `direccion` | varchar(200) | Sí |  | Dirección o ubicación de la zona. |
| `area_m2` | numeric(10,2) | Sí |  | Área en metros cuadrados (opcional); mayor que cero cuando existe. |
| `descripcion` | varchar(300) | Sí |  | Descripción breve de la zona. |
| `creado_en` | timestamptz | No |  | Fecha y hora de registro de la zona. (por defecto: `now()`) |

**Reglas de integridad (CHECK):**

- `zonas_area_m2_check`: `CHECK ((area_m2 > (0)::numeric))`

## 5. `cuadrillas`

Grupos de operarios que ejecutan los servicios en campo.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | smallint | No | PK | Identificador único de la cuadrilla. |
| `nombre` | varchar(80) | No | UQ | Nombre de la cuadrilla; es único. |
| `activa` | boolean | No |  | Indica si la cuadrilla puede recibir nuevas asignaciones. (por defecto: `true`) |

## 6. `operarios`

Trabajadores de campo. Cada uno pertenece a una cuadrilla; solo algunos tienen cuenta de usuario.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único del operario. |
| `usuario_id` | integer | Sí | FK → usuarios.id, UQ | Cuenta de usuario del operario (opcional); debe tener rol operario. |
| `rol_usuario` | rol_usuario | No | FK → usuarios.rol | Columna técnica fija en "operario"; permite validar el rol del usuario con una llave foránea compuesta. (por defecto: `'operario'::rol_usuario`) |
| `nombre` | varchar(120) | No |  | Nombre completo del operario. |
| `cuadrilla_id` | smallint | No | FK → cuadrillas.id | Cuadrilla a la que pertenece. |
| `es_lider` | boolean | No |  | Indica si es el líder de la cuadrilla; solo puede haber uno por cuadrilla. (por defecto: `false`) |
| `activo` | boolean | No |  | Indica si el operario está en servicio. (por defecto: `true`) |

**Reglas de integridad (CHECK):**

- `ck_operarios_rol`: `CHECK ((rol_usuario = 'operario'::rol_usuario))`

## 7. `cotizaciones`

Cotizaciones de servicio. Nacen como solicitud, se arman en borrador tras la visita técnica y se envían al cliente con precio fijo y vigencia (HU-01, HU-02).

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único de la cotización. |
| `consecutivo` | varchar(20) | No | UQ | Número de la cotización (por ejemplo, COT-0001); se asigna automáticamente. (por defecto: `('COT-'::text || lpad((nextval('seq_consecutivo_cotizacion'::regclass))::text, 4, '0'::text))`) |
| `cliente_id` | integer | No | FK compuesta con `zona_id` → zonas(cliente_id) | Cliente que solicita o recibe la cotización. |
| `zona_id` | integer | No | FK compuesta con `cliente_id` → zonas(id) | Zona del servicio; debe pertenecer al mismo cliente. |
| `objeto` | text | No |  | Objeto de la cotización: descripción del servicio a prestar. |
| `alcance` | text | Sí |  | Alcance técnico: actividades que se realizarán. |
| `incluye` | text | Sí |  | Qué incluye el servicio (personal, herramientas, insumos, transporte, seguridad). |
| `tiempo_ejecucion` | varchar(200) | Sí |  | Tiempo de ejecución, que se coordina con el cliente. |
| `observaciones` | text | Sí |  | Condiciones y observaciones adicionales. |
| `vigencia_dias` | smallint | No |  | Días de vigencia de la cotización desde su envío (15 por defecto). (por defecto: `15`) |
| `estado` | estado_cotizacion | No |  | Estado: solicitada, borrador, enviada, aceptada o rechazada. (por defecto: `'solicitada'::estado_cotizacion`) |
| `total` | numeric(16,2) | Sí |  | Total de la cotización; se calcula como la suma de sus líneas. |
| `creada_por` | integer | No | FK → usuarios.id | Usuario que registró la solicitud o la cotización. |
| `solicitada_en` | timestamptz | No |  | Fecha y hora de la solicitud. (por defecto: `now()`) |
| `enviada_en` | timestamptz | Sí |  | Fecha y hora de envío al cliente; desde ese momento el precio es fijo. |

**Reglas de integridad (CHECK):**

- `ck_cotizaciones_envio`: `CHECK ((((estado = ANY (ARRAY['solicitada'::estado_cotizacion, 'borrador'::estado_cotizacion])) AND (enviada_en IS NULL)) OR ((estado = ANY (ARRAY['enviada'::estado_cotizacion, 'aceptada'::estado_cotizacion, 'rechazada'::estado_cotizacion])) AND (enviada_en IS NOT NULL) AND (total IS NOT NULL) AND (total > (0)::numeric))))`
- `ck_cotizaciones_fechas`: `CHECK (((enviada_en IS NULL) OR (enviada_en >= solicitada_en)))`
- `cotizaciones_vigencia_dias_check`: `CHECK ((vigencia_dias > 0))`

## 8. `visitas_tecnicas`

Visita técnica previa a la cotización, para conocer lo que necesita el cliente.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único de la visita. |
| `cotizacion_id` | integer | No | FK → cotizaciones.id | Cotización a la que corresponde la visita. |
| `fecha` | date | No |  | Fecha en que se realizó la visita. |
| `realizada_por` | integer | No | FK → usuarios.id | Usuario que realizó la visita. |
| `observaciones` | text | Sí |  | Observaciones de la visita. |

## 9. `cotizacion_lineas`

Líneas de valor que ve el cliente: concepto, cantidad, valor unitario y valor total.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único de la línea. |
| `cotizacion_id` | integer | No | FK → cotizaciones.id | Cotización a la que pertenece. |
| `servicio_id` | smallint | Sí | FK → servicios.id | Servicio del catálogo asociado (opcional). |
| `concepto` | varchar(200) | No |  | Descripción del concepto cobrado. |
| `cantidad` | numeric(12,2) | No |  | Cantidad de unidades (árboles, metros cuadrados, jornadas, etc.); mayor que cero. |
| `valor_unitario` | numeric(14,2) | No |  | Valor de cada unidad en pesos colombianos. |
| `valor_total` | numeric(16,2) | Sí |  | Cantidad por valor unitario; se calcula automáticamente. (calculada) |

**Reglas de integridad (CHECK):**

- `cotizacion_lineas_cantidad_check`: `CHECK ((cantidad > (0)::numeric))`
- `cotizacion_lineas_valor_unitario_check`: `CHECK ((valor_unitario >= (0)::numeric))`

## 10. `cotizacion_costos`

Análisis interno de costos del administrador (mano de obra, maquinaria, combustible, transporte); no lo ve el cliente.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único del costo. |
| `cotizacion_id` | integer | No | FK → cotizaciones.id | Cotización a la que pertenece. |
| `tipo` | tipo_costo | No |  | Tipo de costo: mano de obra, maquinaria, herramientas, combustible, transporte u otro. |
| `descripcion` | varchar(200) | No |  | Descripción del costo. |
| `cantidad` | numeric(12,2) | No |  | Cantidad de unidades (trabajadores por día, galones, viajes, etc.). |
| `valor_unitario` | numeric(14,2) | No |  | Valor de cada unidad en pesos colombianos. |
| `subtotal` | numeric(16,2) | Sí |  | Cantidad por valor unitario; se calcula automáticamente. (calculada) |

**Reglas de integridad (CHECK):**

- `cotizacion_costos_cantidad_check`: `CHECK ((cantidad > (0)::numeric))`
- `cotizacion_costos_valor_unitario_check`: `CHECK ((valor_unitario >= (0)::numeric))`

## 11. `cotizacion_hitos`

Forma de pago por hitos de la cotización (anticipo, avance y saldo); los porcentajes deben sumar 100.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `cotizacion_id` | integer | No | PK, FK → cotizaciones.id | Cotización a la que pertenece. |
| `orden` | smallint | No | PK | Número de orden del hito dentro de la cotización. |
| `descripcion` | varchar(200) | No |  | Descripción del hito de pago (por ejemplo, anticipo al iniciar). |
| `porcentaje` | numeric(5,2) | No |  | Porcentaje del total que se paga en el hito (mayor que 0 y hasta 100). |

**Reglas de integridad (CHECK):**

- `cotizacion_hitos_orden_check`: `CHECK ((orden > 0))`
- `cotizacion_hitos_porcentaje_check`: `CHECK (((porcentaje > (0)::numeric) AND (porcentaje <= (100)::numeric)))`

## 12. `ordenes_trabajo`

Servicios programados y ejecutados: horario, cuadrilla, estado y registro de finalización (HU-03 a HU-07).

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único de la orden de trabajo. |
| `cotizacion_id` | integer | Sí | FK → cotizaciones.id | Cotización aceptada de la que proviene la orden (opcional). |
| `zona_id` | integer | No | FK → zonas.id | Zona donde se ejecuta el servicio. |
| `tipo_servicio` | varchar(120) | No |  | Descripción del servicio a ejecutar. |
| `cuadrilla_id` | smallint | Sí | FK → cuadrillas.id | Cuadrilla asignada; vacío mientras la orden está por asignar. |
| `inicio` | timestamptz | No |  | Fecha y hora programadas de inicio. |
| `fin` | timestamptz | No |  | Fecha y hora programadas de finalización; posterior al inicio. |
| `estado` | estado_orden | No |  | Estado: pendiente, en_ejecucion o finalizada. (por defecto: `'pendiente'::estado_orden`) |
| `iniciada_en` | timestamptz | Sí |  | Fecha y hora reales de inicio del servicio. |
| `finalizada_en` | timestamptz | Sí |  | Fecha y hora reales de finalización (HU-06). |
| `finalizada_por` | integer | Sí | FK → operarios.id | Operario que finalizó la orden; debe ser de la cuadrilla asignada (HU-06). |
| `nota_finalizacion` | text | Sí |  | Nota opcional del operario al finalizar (novedades o incidencias). |
| `creado_en` | timestamptz | No |  | Fecha y hora de creación de la orden. (por defecto: `now()`) |

**Reglas de integridad (CHECK):**

- `ck_ordenes_cuadrilla`: `CHECK (((estado = 'pendiente'::estado_orden) OR (cuadrilla_id IS NOT NULL)))`
- `ck_ordenes_finalizacion`: `CHECK ((((estado = 'finalizada'::estado_orden) AND (finalizada_en IS NOT NULL) AND (finalizada_por IS NOT NULL)) OR ((estado <> 'finalizada'::estado_orden) AND (finalizada_en IS NULL) AND (finalizada_por IS NULL))))`
- `ck_ordenes_horario`: `CHECK ((fin > inicio))`
- `ck_ordenes_inicio_real`: `CHECK (((estado = 'pendiente'::estado_orden) OR (iniciada_en IS NOT NULL)))`

## 13. `planillas_jornada`

Planillas de apuntamiento de labores de un cliente en un periodo: la de campo y la administrativa, que se comparan antes de facturar (HU-09, HU-10).

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único de la planilla. |
| `cliente_id` | integer | No | FK → clientes.id, UQ | Cliente al que corresponde la planilla. |
| `periodo_desde` | date | No | UQ | Primer día del periodo de la planilla. |
| `periodo_hasta` | date | No | UQ | Último día del periodo; no anterior al primero. |
| `origen` | origen_planilla | No | UQ | Origen de la planilla: campo (responsable de campo) o administrativa. |
| `estado` | estado_planilla | No |  | Estado: borrador, en_comparacion o conciliada; una planilla conciliada no se modifica. (por defecto: `'borrador'::estado_planilla`) |
| `registrada_por` | integer | No | FK → usuarios.id | Usuario que registró la planilla. |
| `creado_en` | timestamptz | No |  | Fecha y hora de creación de la planilla. (por defecto: `now()`) |

**Reglas de integridad (CHECK):**

- `ck_planillas_periodo`: `CHECK ((periodo_hasta >= periodo_desde))`

## 14. `registros_jornada`

Registros de turno por trabajador y día: lote, actividad, labor, hora de inicio y fin y horas trabajadas.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único del registro. |
| `planilla_id` | integer | No | FK → planillas_jornada.id, UQ | Planilla a la que pertenece. |
| `operario_id` | integer | No | FK → operarios.id, UQ | Trabajador que realizó la jornada. |
| `fecha` | date | No | UQ | Fecha de la jornada. |
| `zona_id` | integer | No | FK → zonas.id | Lote o zona donde se trabajó. |
| `centro_costo` | varchar(60) | Sí |  | Centro de costo de la actividad. |
| `actividad` | varchar(80) | No |  | Conjunto de actividades (por ejemplo, riego o resiembra). |
| `labor` | varchar(120) | No |  | Labor específica realizada (por ejemplo, motobombero). |
| `hora_inicio` | time | No | UQ | Hora de inicio del turno. |
| `hora_fin` | time | No |  | Hora de fin del turno; si es menor que la de inicio, el turno cruza la medianoche. |
| `descanso_horas` | numeric(4,2) | No |  | Horas de descanso que se descuentan del turno. (por defecto: `0`) |
| `horas` | numeric(5,2) | Sí |  | Horas trabajadas; se calcula automáticamente a partir del turno y el descanso. (calculada) |
| `dominical_festivo` | boolean | No |  | Indica si la jornada fue en domingo o festivo. (por defecto: `false`) |

**Reglas de integridad (CHECK):**

- `ck_registros_horas`: `CHECK ((hora_inicio <> hora_fin))`
- `registros_jornada_descanso_horas_check`: `CHECK ((descanso_horas >= (0)::numeric))`

## Reglas de negocio implementadas en la base de datos

| Regla | Dónde se aplica | Historia |
|---|---|---|
| El total de la cotización es la suma de sus líneas (cantidad × valor unitario) | trigger `trg_lineas_total`, columna calculada `valor_total` | HU-01 |
| La cotización exige visita técnica, al menos una línea y hitos de pago que sumen 100 % | procedimiento `sp_enviar_cotizacion` | HU-01 |
| Una cotización enviada tiene precio fijo: no se modifican líneas, costos ni hitos | trigger `fn_recalcular_total` | HU-01 |
| La cotización solo se acepta dentro de su vigencia (15 días por defecto) | procedimiento `sp_responder_cotizacion` | HU-02 |
| La zona de una cotización pertenece al cliente | llave foránea compuesta `fk_cotizaciones_zona_cliente` | HU-01 / HU-02 |
| Una cuadrilla no puede tener dos servicios en el mismo horario | trigger `trg_ordenes_validar` | HU-03 |
| Una orden solo se crea desde una cotización aceptada | trigger `trg_ordenes_validar` | HU-03 |
| Una orden en ejecución o finalizada tiene cuadrilla asignada | `ck_ordenes_cuadrilla` | HU-04 |
| El operario solo ve las órdenes de su cuadrilla | vista `v_ordenes_operario` | HU-05 |
| Al finalizar se registra fecha, hora y responsable de la cuadrilla | `ck_ordenes_finalizacion`, `trg_ordenes_validar` | HU-06 |
| Historial de servicios finalizados por cliente | vista `v_historial_servicios` | HU-07 |
| Reporte de cotizaciones, servicios y horas por periodo y cliente | función `fn_reporte_periodo` | HU-08 |
| Las horas de un turno se calculan solas, incluso si cruza la medianoche | columna calculada `registros_jornada.horas` | HU-09 |
| Se comparan planillas de campo y administrativa por trabajador y día | función `fn_comparar_planillas` | HU-10 |
| Solo se concilian planillas sin diferencias; una planilla conciliada no se modifica | `sp_conciliar_planillas`, trigger `trg_registros_bloqueo` | HU-10 |
| Perfiles de acceso: aplicación y reportes (sin acceso a usuarios ni a costos internos) | roles `dpm_app` y `dpm_reportes` | RNF-04 |