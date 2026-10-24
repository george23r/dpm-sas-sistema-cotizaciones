# Diccionario de datos — DPM SAS

Base de datos PostgreSQL, esquema `dpm`. Generado a partir del catálogo de la base de datos (`01_schema.sql`).

**Resumen:** 12 tablas, 83 columnas.

## 1. `usuarios`

Cuentas de acceso al sistema. Cada persona que ingresa (administrador, cliente u operario) tiene un usuario con un rol.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único del usuario (generado automáticamente). |
| `nombre` | varchar(120) | No |  | Nombre completo de la persona. |
| `correo` | varchar(160) | No |  | Correo electrónico usado para iniciar sesión; es único sin distinguir mayúsculas. |
| `password_hash` | varchar(255) | No |  | Contraseña almacenada como hash (nunca en texto plano), según RNF-02. |
| `rol` | rol_usuario | No | UQ compuesta con `id` | Perfil de acceso: administrador, cliente u operario (RNF-04). |
| `activo` | boolean | No |  | Indica si la cuenta puede iniciar sesión. Se desactiva en lugar de borrar. (por defecto: `true`) |
| `creado_en` | timestamptz | No |  | Fecha y hora de creación de la cuenta. (por defecto: `now()`) |

**Reglas de integridad (CHECK):**

- `ck_usuarios_correo`: `CHECK (((correo)::text ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'::text))`

## 2. `clientes`

Empresas o conjuntos a los que DPM SAS presta el servicio. Puede tener o no una cuenta de usuario.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único del cliente. |
| `usuario_id` | integer | Sí | FK → usuarios.id, UQ | Cuenta de usuario del cliente (opcional). Debe ser un usuario con rol cliente. |
| `rol_usuario` | rol_usuario | No | FK → usuarios.rol | Columna técnica fija en "cliente"; permite validar el rol del usuario con una llave foránea compuesta. (por defecto: `'cliente'::rol_usuario`) |
| `nombre` | varchar(150) | No | UQ | Nombre o razón social del cliente; es único. |
| `tipo` | tipo_cliente | No |  | Clasificación del cliente: residencial, comercial o institucional. |
| `telefono` | varchar(30) | Sí |  | Teléfono de contacto. |
| `correo_contacto` | varchar(160) | Sí |  | Correo de contacto del cliente. |
| `creado_en` | timestamptz | No |  | Fecha y hora de registro del cliente. (por defecto: `now()`) |

**Reglas de integridad (CHECK):**

- `ck_clientes_rol`: `CHECK ((rol_usuario = 'cliente'::rol_usuario))`

## 3. `tipos_vegetacion`

Catálogo de tipos de vegetación con el factor que ajusta el precio de la cotización (regla de negocio).

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | smallint | No | PK | Identificador único del tipo de vegetación. |
| `nombre` | varchar(60) | No | UQ | Nombre del tipo (césped simple, jardín ornamental, zona arborizada, mixta). |
| `factor` | numeric(4,2) | No |  | Multiplicador del precio por tipo de vegetación; debe ser mayor que cero. |
| `activo` | boolean | No |  | Indica si el tipo está disponible para nuevas cotizaciones. (por defecto: `true`) |

**Reglas de integridad (CHECK):**

- `tipos_vegetacion_factor_check`: `CHECK ((factor > (0)::numeric))`

## 4. `frecuencias`

Catálogo de frecuencias del servicio con el factor que ajusta el precio (descuento por recurrencia).

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | smallint | No | PK | Identificador único de la frecuencia. |
| `nombre` | varchar(60) | No | UQ | Nombre de la frecuencia (única vez, mensual, quincenal, semanal). |
| `factor` | numeric(4,2) | No |  | Multiplicador del precio por frecuencia; debe ser mayor que cero. |
| `dias_intervalo` | smallint | Sí |  | Días entre servicios; vacío para servicios de única vez. |
| `activo` | boolean | No |  | Indica si la frecuencia está disponible para nuevas cotizaciones. (por defecto: `true`) |

**Reglas de integridad (CHECK):**

- `frecuencias_dias_intervalo_check`: `CHECK ((dias_intervalo > 0))`
- `frecuencias_factor_check`: `CHECK ((factor > (0)::numeric))`

## 5. `parametros_tarifa`

Parámetros generales de la fórmula de cotización, configurables por el administrador.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `clave` | varchar(50) | No | PK | Nombre del parámetro (tarifa_base_m2, costo_operario). |
| `valor` | numeric(12,2) | No |  | Valor numérico del parámetro en pesos colombianos; no puede ser negativo. |
| `descripcion` | varchar(200) | No |  | Explicación de qué representa el parámetro. |

**Reglas de integridad (CHECK):**

- `parametros_tarifa_valor_check`: `CHECK ((valor >= (0)::numeric))`

## 6. `equipos`

Catálogo de equipos (guadañadora, motosierra, fumigadora) con su costo de uso por servicio.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | smallint | No | PK | Identificador único del equipo. |
| `nombre` | varchar(80) | No | UQ | Nombre del equipo; es único. |
| `costo_uso` | numeric(12,2) | No |  | Costo de usar el equipo en un servicio, en pesos colombianos. |
| `activo` | boolean | No |  | Indica si el equipo está disponible para nuevas cotizaciones. (por defecto: `true`) |

**Reglas de integridad (CHECK):**

- `equipos_costo_uso_check`: `CHECK ((costo_uso >= (0)::numeric))`

## 7. `zonas`

Predios o zonas verdes de cada cliente que reciben mantenimiento.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único de la zona. |
| `cliente_id` | integer | No | FK → clientes.id; UQ compuesta con `id` | Cliente propietario de la zona; participa en la clave única `(id, cliente_id)` para preservar integridad de las cotizaciones. |
| `nombre` | varchar(120) | No | UQ | Nombre de la zona; es único dentro de cada cliente. |
| `direccion` | varchar(200) | No |  | Dirección donde se ubica la zona. |
| `area_m2` | numeric(10,2) | No |  | Área en metros cuadrados; debe ser mayor que cero. |
| `tipo_vegetacion_id` | smallint | No | FK → tipos_vegetacion.id | Tipo de vegetación predominante de la zona. |
| `creado_en` | timestamptz | No |  | Fecha y hora de registro de la zona. (por defecto: `now()`) |

**Reglas de integridad (CHECK):**

- `zonas_area_m2_check`: `CHECK ((area_m2 > (0)::numeric))`

## 8. `cuadrillas`

Grupos de operarios que ejecutan los servicios en campo.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | smallint | No | PK | Identificador único de la cuadrilla. |
| `nombre` | varchar(80) | No | UQ | Nombre de la cuadrilla; es único. |
| `activa` | boolean | No |  | Indica si la cuadrilla puede recibir nuevas asignaciones. (por defecto: `true`) |

## 9. `operarios`

Personal de campo. Cada operario pertenece a una cuadrilla; solo algunos tienen cuenta de usuario.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único del operario. |
| `usuario_id` | integer | Sí | FK → usuarios.id, UQ | Cuenta de usuario del operario (opcional). Debe ser un usuario con rol operario. |
| `rol_usuario` | rol_usuario | No | FK → usuarios.rol | Columna técnica fija en "operario"; permite validar el rol del usuario con una llave foránea compuesta. (por defecto: `'operario'::rol_usuario`) |
| `nombre` | varchar(120) | No |  | Nombre completo del operario. |
| `cuadrilla_id` | smallint | No | FK → cuadrillas.id | Cuadrilla a la que pertenece (varios operarios por cuadrilla). |
| `es_lider` | boolean | No |  | Indica si es el líder de la cuadrilla; solo puede haber uno por cuadrilla. (por defecto: `false`) |
| `activo` | boolean | No |  | Indica si el operario está en servicio. (por defecto: `true`) |

**Reglas de integridad (CHECK):**

- `ck_operarios_rol`: `CHECK ((rol_usuario = 'operario'::rol_usuario))`

## 10. `cotizaciones`

Solicitudes y cotizaciones de servicio. Nace como "pendiente" (sin precio) y, al calcularse, guarda el desglose del precio (HU-01, HU-02).

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único de la cotización. |
| `cliente_id` | integer | No | FK compuesta con `zona_id` → zonas(cliente_id) | Cliente que solicita la cotización; junto con `zona_id` valida que la zona le pertenece. |
| `zona_id` | integer | No | FK compuesta con `cliente_id` → zonas(id) | Zona a cotizar; la restricción real es `FOREIGN KEY (zona_id, cliente_id) REFERENCES zonas(id, cliente_id)`. |
| `area_m2` | numeric(10,2) | No |  | Área en metros cuadrados usada para calcular el precio. |
| `tipo_vegetacion_id` | smallint | No | FK → tipos_vegetacion.id | Tipo de vegetación considerado en el cálculo. |
| `frecuencia_id` | smallint | No | FK → frecuencias.id | Frecuencia del servicio considerada en el cálculo. |
| `num_operarios` | smallint | No |  | Número de operarios requeridos (entre 1 y 50). |
| `observaciones` | text | Sí |  | Comentarios adicionales del cliente o del administrador. |
| `estado` | estado_cotizacion | No |  | Estado: pendiente, enviada, aceptada o rechazada. Es pendiente si y solo si no tiene precio. (por defecto: `'pendiente'::estado_cotizacion`) |
| `tarifa_base_aplicada` | numeric(12,2) | Sí |  | Tarifa base por m² vigente cuando se calculó el precio (copia histórica). |
| `factor_vegetacion_aplicado` | numeric(4,2) | Sí |  | Factor de vegetación vigente cuando se calculó (copia histórica). |
| `factor_frecuencia_aplicado` | numeric(4,2) | Sí |  | Factor de frecuencia vigente cuando se calculó (copia histórica). |
| `subtotal_area` | numeric(14,2) | Sí |  | Área × tarifa base × factor de vegetación × factor de frecuencia. |
| `costo_personal` | numeric(14,2) | Sí |  | Número de operarios × costo por operario. |
| `costo_equipos` | numeric(14,2) | Sí |  | Suma del costo de los equipos requeridos. |
| `precio_total` | numeric(14,2) | Sí |  | Precio final: subtotal por área + costo de personal + costo de equipos. |
| `creada_por` | integer | No | FK → usuarios.id | Usuario que registró la solicitud (cliente o administrador). |
| `solicitada_en` | timestamptz | No |  | Fecha y hora de la solicitud. (por defecto: `now()`) |
| `enviada_en` | timestamptz | Sí |  | Fecha y hora en que se calculó y envió el precio al cliente. |

**Reglas de integridad (CHECK):**

- `ck_cotizaciones_fechas`: `CHECK (((enviada_en IS NULL) OR (enviada_en >= solicitada_en)))`
- `ck_cotizaciones_precio_estado`: `CHECK ((((estado = 'pendiente'::estado_cotizacion) AND (precio_total IS NULL) AND (subtotal_area IS NULL) AND (costo_personal IS NULL) AND (costo_equipos IS NULL) AND (tarifa_base_aplicada IS NULL) AND (factor_vegetacion_aplicado IS NULL) AND (factor_frecuencia_aplicado IS NULL) AND (enviada_en IS NULL)) OR ((estado <> 'pendiente'::estado_cotizacion) AND (precio_total IS NOT NULL) AND (subtotal_area IS NOT NULL) AND (costo_personal IS NOT NULL) AND (costo_equipos IS NOT NULL) AND (tarifa_base_aplicada IS NOT NULL) AND (factor_vegetacion_aplicado IS NOT NULL) AND (factor_frecuencia_aplicado IS NOT NULL) AND (enviada_en IS NOT NULL))))`
- `ck_cotizaciones_total`: `CHECK (((precio_total IS NULL) OR (precio_total = ((subtotal_area + costo_personal) + costo_equipos))))`
- `cotizaciones_area_m2_check`: `CHECK ((area_m2 > (0)::numeric))`
- `cotizaciones_num_operarios_check`: `CHECK (((num_operarios >= 1) AND (num_operarios <= 50)))`

## 11. `cotizacion_equipos`

Equipos incluidos en cada cotización, con el costo aplicado en ese momento.

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `cotizacion_id` | integer | No | PK, FK → cotizaciones.id | Cotización a la que pertenece. |
| `equipo_id` | smallint | No | PK, FK → equipos.id | Equipo incluido. |
| `costo_aplicado` | numeric(12,2) | No |  | Costo del equipo vigente al calcular la cotización (copia histórica). |

**Reglas de integridad (CHECK):**

- `cotizacion_equipos_costo_aplicado_check`: `CHECK ((costo_aplicado >= (0)::numeric))`

## 12. `ordenes_trabajo`

Servicios programados y ejecutados: fecha, cuadrilla, estado y registro de finalización (HU-03 a HU-07).

| Columna | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `id` | integer | No | PK | Identificador único de la orden de trabajo. |
| `cotizacion_id` | integer | Sí | FK → cotizaciones.id | Cotización aceptada de la que proviene la orden (opcional). |
| `zona_id` | integer | No | FK → zonas.id | Zona donde se ejecuta el servicio. |
| `tipo_servicio` | varchar(120) | No |  | Descripción del servicio (por ejemplo, corte de césped y perfilado). |
| `cuadrilla_id` | smallint | Sí | FK → cuadrillas.id | Cuadrilla asignada; vacío mientras la orden está por asignar. |
| `inicio` | timestamptz | No |  | Fecha y hora programadas de inicio. |
| `fin` | timestamptz | No |  | Fecha y hora programadas de finalización; debe ser posterior al inicio. |
| `estado` | estado_orden | No |  | Estado: pendiente, en_ejecucion o finalizada. (por defecto: `'pendiente'::estado_orden`) |
| `iniciada_en` | timestamptz | Sí |  | Fecha y hora reales en que el operario inició el servicio. |
| `finalizada_en` | timestamptz | Sí |  | Fecha y hora reales de finalización (HU-06). |
| `finalizada_por` | integer | Sí | FK → operarios.id | Operario que marcó la orden como finalizada (HU-06); debe ser de la cuadrilla asignada. |
| `nota_finalizacion` | text | Sí |  | Nota opcional del operario al finalizar (por ejemplo, novedades o incidencias). |
| `creado_en` | timestamptz | No |  | Fecha y hora de creación de la orden. (por defecto: `now()`) |

**Reglas de integridad (CHECK):**

- `ck_ordenes_cuadrilla`: `CHECK (((estado = 'pendiente'::estado_orden) OR (cuadrilla_id IS NOT NULL)))`
- `ck_ordenes_finalizacion`: `CHECK ((((estado = 'finalizada'::estado_orden) AND (finalizada_en IS NOT NULL) AND (finalizada_por IS NOT NULL)) OR ((estado <> 'finalizada'::estado_orden) AND (finalizada_en IS NULL) AND (finalizada_por IS NULL))))`
- `ck_ordenes_horario`: `CHECK ((fin > inicio))`
- `ck_ordenes_inicio_real`: `CHECK (((estado = 'pendiente'::estado_orden) OR (iniciada_en IS NOT NULL)))`

## Reglas de negocio implementadas en la base de datos

| Regla | Dónde se aplica | Historia |
|---|---|---|
| Precio = (área × tarifa × factor vegetación × factor frecuencia) + operarios × costo + equipos | `fn_calcular_precio`, `sp_calcular_y_enviar_cotizacion` | HU-01 |
| Una cotización está pendiente si y solo si no tiene precio | `ck_cotizaciones_precio_estado` | HU-01 |
| El precio total es la suma de sus componentes | `ck_cotizaciones_total` | HU-01 |
| Una cuadrilla no puede tener dos servicios en el mismo horario | trigger `trg_ordenes_validar` | HU-03 |
| Una orden en ejecución o finalizada tiene cuadrilla asignada | `ck_ordenes_cuadrilla` | HU-04 |
| El operario solo ve las órdenes de su cuadrilla | vista `v_ordenes_operario` | HU-05 |
| Al finalizar se registra fecha, hora y responsable; el responsable es de la cuadrilla | `ck_ordenes_finalizacion`, `trg_ordenes_validar` | HU-06 |
| Historial de servicios finalizados por cliente | vista `v_historial_servicios` | HU-07 |
| Reporte de cotizaciones y servicios por periodo y cliente | `fn_reporte_periodo` | HU-08 |
| La zona de una cotización pertenece al cliente | llave foránea compuesta `fk_cotizaciones_zona_cliente` | HU-01 / HU-02 |
| Perfiles de acceso: aplicación y reportes (sin acceso a usuarios) | roles `dpm_app` y `dpm_reportes` | RNF-04 |

> **Nota de claves compuestas.** En PostgreSQL, `cotizaciones(zona_id, cliente_id)` referencia conjuntamente `zonas(id, cliente_id)`. Los campos `usuarios.id`/`rol` también se referencian conjuntamente en los perfiles de clientes y operarios. Las marcas `UQ` de columnas individuales no deben interpretarse como restricciones de unicidad individuales cuando su origen es una clave compuesta.
