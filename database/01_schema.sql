-- =====================================================================
-- DPM SAS — Sistema de información web para la gestión de cotizaciones
-- y mantenimiento de zonas verdes
-- Base de datos: PostgreSQL 14 o superior
-- Archivo: 01_schema.sql  (esquema, restricciones, índices, funciones,
--                          vistas y permisos)
-- Trabajo de Grado I — Corte 2 — Objetivo específico 2 (diseño)
--
-- Uso:  psql -d <base_de_datos> -f 01_schema.sql
-- ATENCIÓN: el script borra y recrea el esquema "dpm" (entorno de desarrollo).
-- =====================================================================

DROP SCHEMA IF EXISTS dpm CASCADE;
CREATE SCHEMA dpm;
SET search_path = dpm, public;

-- ---------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- ---------------------------------------------------------------------
CREATE TYPE rol_usuario        AS ENUM ('administrador', 'cliente', 'operario');
CREATE TYPE tipo_cliente       AS ENUM ('residencial', 'comercial', 'institucional');
CREATE TYPE estado_cotizacion  AS ENUM ('pendiente', 'enviada', 'aceptada', 'rechazada');
CREATE TYPE estado_orden       AS ENUM ('pendiente', 'en_ejecucion', 'finalizada');

-- ---------------------------------------------------------------------
-- 2. TABLAS DE USUARIOS Y PERFILES  (RNF-02, RNF-04)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         varchar(120) NOT NULL,
    correo         varchar(160) NOT NULL,
    password_hash  varchar(255) NOT NULL,
    rol            rol_usuario  NOT NULL,
    activo         boolean      NOT NULL DEFAULT true,
    creado_en      timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT ck_usuarios_correo CHECK (correo ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
    CONSTRAINT uq_usuarios_id_rol UNIQUE (id, rol)      -- soporta las FK compuestas de clientes y operarios
);
CREATE UNIQUE INDEX uq_usuarios_correo ON usuarios (lower(correo));

CREATE TABLE clientes (
    id               integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id       integer,
    rol_usuario      rol_usuario  NOT NULL DEFAULT 'cliente',
    nombre           varchar(150) NOT NULL,
    tipo             tipo_cliente NOT NULL,
    telefono         varchar(30),
    correo_contacto  varchar(160),
    creado_en        timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_clientes_usuario  UNIQUE (usuario_id),
    CONSTRAINT uq_clientes_nombre   UNIQUE (nombre),
    CONSTRAINT ck_clientes_rol      CHECK (rol_usuario = 'cliente'),
    -- el usuario enlazado debe tener rol 'cliente'
    CONSTRAINT fk_clientes_usuario  FOREIGN KEY (usuario_id, rol_usuario)
        REFERENCES usuarios (id, rol)
);

-- ---------------------------------------------------------------------
-- 3. PARÁMETROS DE TARIFA (reglas de negocio de la cotización — OE1)
-- ---------------------------------------------------------------------
CREATE TABLE tipos_vegetacion (
    id      smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre  varchar(60)   NOT NULL UNIQUE,
    factor  numeric(4,2)  NOT NULL CHECK (factor > 0),
    activo  boolean       NOT NULL DEFAULT true
);

CREATE TABLE frecuencias (
    id              smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre          varchar(60)   NOT NULL UNIQUE,
    factor          numeric(4,2)  NOT NULL CHECK (factor > 0),
    dias_intervalo  smallint      CHECK (dias_intervalo > 0),   -- NULL = servicio de única vez
    activo          boolean       NOT NULL DEFAULT true
);

CREATE TABLE parametros_tarifa (
    clave        varchar(50)   PRIMARY KEY,
    valor        numeric(12,2) NOT NULL CHECK (valor >= 0),
    descripcion  varchar(200)  NOT NULL
);

CREATE TABLE equipos (
    id         smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre     varchar(80)   NOT NULL UNIQUE,
    costo_uso  numeric(12,2) NOT NULL CHECK (costo_uso >= 0),
    activo     boolean       NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------
-- 4. ZONAS VERDES
-- ---------------------------------------------------------------------
CREATE TABLE zonas (
    id                  integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id          integer       NOT NULL REFERENCES clientes (id),
    nombre              varchar(120)  NOT NULL,
    direccion           varchar(200)  NOT NULL,
    area_m2             numeric(10,2) NOT NULL CHECK (area_m2 > 0),
    tipo_vegetacion_id  smallint      NOT NULL REFERENCES tipos_vegetacion (id),
    creado_en           timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT uq_zonas_cliente_nombre UNIQUE (cliente_id, nombre),
    CONSTRAINT uq_zonas_id_cliente     UNIQUE (id, cliente_id)   -- soporta FK compuesta de cotizaciones
);

-- ---------------------------------------------------------------------
-- 5. CUADRILLAS Y OPERARIOS  (HU-04, HU-05)
-- ---------------------------------------------------------------------
CREATE TABLE cuadrillas (
    id      smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre  varchar(80) NOT NULL UNIQUE,
    activa  boolean     NOT NULL DEFAULT true
);

CREATE TABLE operarios (
    id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id   integer,
    rol_usuario  rol_usuario NOT NULL DEFAULT 'operario',
    nombre       varchar(120) NOT NULL,
    cuadrilla_id smallint     NOT NULL REFERENCES cuadrillas (id),
    es_lider     boolean      NOT NULL DEFAULT false,
    activo       boolean      NOT NULL DEFAULT true,
    CONSTRAINT uq_operarios_usuario UNIQUE (usuario_id),
    CONSTRAINT ck_operarios_rol     CHECK (rol_usuario = 'operario'),
    CONSTRAINT fk_operarios_usuario FOREIGN KEY (usuario_id, rol_usuario)
        REFERENCES usuarios (id, rol)
);
-- una cuadrilla tiene un solo líder
CREATE UNIQUE INDEX uq_operarios_un_lider_por_cuadrilla ON operarios (cuadrilla_id) WHERE es_lider;
CREATE INDEX ix_operarios_cuadrilla ON operarios (cuadrilla_id);

-- ---------------------------------------------------------------------
-- 6. COTIZACIONES  (HU-01, HU-02)
-- ---------------------------------------------------------------------
CREATE TABLE cotizaciones (
    id                         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id                 integer      NOT NULL,
    zona_id                    integer      NOT NULL,
    area_m2                    numeric(10,2) NOT NULL CHECK (area_m2 > 0),
    tipo_vegetacion_id         smallint     NOT NULL REFERENCES tipos_vegetacion (id),
    frecuencia_id              smallint     NOT NULL REFERENCES frecuencias (id),
    num_operarios              smallint     NOT NULL CHECK (num_operarios BETWEEN 1 AND 50),
    observaciones              text,
    estado                     estado_cotizacion NOT NULL DEFAULT 'pendiente',
    -- "foto" de los valores usados al calcular el precio (no cambian si luego cambia la tarifa)
    tarifa_base_aplicada       numeric(12,2),
    factor_vegetacion_aplicado numeric(4,2),
    factor_frecuencia_aplicado numeric(4,2),
    subtotal_area              numeric(14,2),
    costo_personal             numeric(14,2),
    costo_equipos              numeric(14,2),
    precio_total               numeric(14,2),
    creada_por                 integer      NOT NULL REFERENCES usuarios (id),
    solicitada_en              timestamptz  NOT NULL DEFAULT now(),
    enviada_en                 timestamptz,
    CONSTRAINT fk_cotizaciones_zona_cliente FOREIGN KEY (zona_id, cliente_id)
        REFERENCES zonas (id, cliente_id),             -- la zona debe pertenecer al cliente
    -- una cotización está pendiente si y solo si aún no tiene precio calculado (HU-01)
    CONSTRAINT ck_cotizaciones_precio_estado CHECK (
        (estado = 'pendiente' AND precio_total IS NULL AND subtotal_area IS NULL AND costo_personal IS NULL
            AND costo_equipos IS NULL AND tarifa_base_aplicada IS NULL AND factor_vegetacion_aplicado IS NULL
            AND factor_frecuencia_aplicado IS NULL AND enviada_en IS NULL)
        OR
        (estado <> 'pendiente' AND precio_total IS NOT NULL AND subtotal_area IS NOT NULL AND costo_personal IS NOT NULL
            AND costo_equipos IS NOT NULL AND tarifa_base_aplicada IS NOT NULL AND factor_vegetacion_aplicado IS NOT NULL
            AND factor_frecuencia_aplicado IS NOT NULL AND enviada_en IS NOT NULL)
    ),
    CONSTRAINT ck_cotizaciones_total CHECK (precio_total IS NULL OR precio_total = subtotal_area + costo_personal + costo_equipos),
    CONSTRAINT ck_cotizaciones_fechas CHECK (enviada_en IS NULL OR enviada_en >= solicitada_en)
);
CREATE INDEX ix_cotizaciones_cliente_estado ON cotizaciones (cliente_id, estado);
CREATE INDEX ix_cotizaciones_estado_fecha   ON cotizaciones (estado, solicitada_en DESC);
CREATE INDEX ix_cotizaciones_zona           ON cotizaciones (zona_id);

CREATE TABLE cotizacion_equipos (
    cotizacion_id  integer       NOT NULL REFERENCES cotizaciones (id) ON DELETE CASCADE,
    equipo_id      smallint      NOT NULL REFERENCES equipos (id),
    costo_aplicado numeric(12,2) NOT NULL CHECK (costo_aplicado >= 0),
    PRIMARY KEY (cotizacion_id, equipo_id)
);
CREATE INDEX ix_cotizacion_equipos_equipo ON cotizacion_equipos (equipo_id);

-- ---------------------------------------------------------------------
-- 7. ÓRDENES DE TRABAJO  (HU-03, HU-04, HU-05, HU-06, HU-07)
-- ---------------------------------------------------------------------
CREATE TABLE ordenes_trabajo (
    id                integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cotizacion_id     integer      REFERENCES cotizaciones (id) ON DELETE SET NULL,
    zona_id           integer      NOT NULL REFERENCES zonas (id),
    tipo_servicio     varchar(120) NOT NULL,
    cuadrilla_id      smallint     REFERENCES cuadrillas (id),
    inicio            timestamptz  NOT NULL,
    fin               timestamptz  NOT NULL,
    estado            estado_orden NOT NULL DEFAULT 'pendiente',
    iniciada_en       timestamptz,
    finalizada_en     timestamptz,
    finalizada_por    integer      REFERENCES operarios (id),
    nota_finalizacion text,
    creado_en         timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT ck_ordenes_horario CHECK (fin > inicio),
    -- una orden en ejecución o finalizada ya tiene cuadrilla asignada (HU-04)
    CONSTRAINT ck_ordenes_cuadrilla CHECK (estado = 'pendiente' OR cuadrilla_id IS NOT NULL),
    CONSTRAINT ck_ordenes_inicio_real CHECK (estado = 'pendiente' OR iniciada_en IS NOT NULL),
    -- al finalizar se registra fecha, hora y responsable (HU-06)
    CONSTRAINT ck_ordenes_finalizacion CHECK (
        (estado = 'finalizada' AND finalizada_en IS NOT NULL AND finalizada_por IS NOT NULL)
        OR
        (estado <> 'finalizada' AND finalizada_en IS NULL AND finalizada_por IS NULL)
    )
);
CREATE INDEX ix_ordenes_cuadrilla_horario ON ordenes_trabajo (cuadrilla_id, inicio, fin);
CREATE INDEX ix_ordenes_zona_inicio       ON ordenes_trabajo (zona_id, inicio DESC);
CREATE INDEX ix_ordenes_estado_inicio     ON ordenes_trabajo (estado, inicio);
CREATE INDEX ix_ordenes_cotizacion        ON ordenes_trabajo (cotizacion_id);

-- Regla de negocio de HU-03: una cuadrilla no puede tener dos servicios en el mismo horario.
-- Se usa un trigger con bloqueo por cuadrilla para evitar condiciones de carrera.
-- (Alternativa equivalente en PostgreSQL con la extensión btree_gist:
--   ALTER TABLE ordenes_trabajo ADD CONSTRAINT ex_ordenes_sin_cruce
--   EXCLUDE USING gist (cuadrilla_id WITH =, tstzrange(inicio, fin) WITH &&) WHERE (cuadrilla_id IS NOT NULL); )
CREATE FUNCTION fn_validar_orden() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.cuadrilla_id IS NOT NULL THEN
        PERFORM pg_advisory_xact_lock(7001, NEW.cuadrilla_id);
        IF EXISTS (
            SELECT 1 FROM ordenes_trabajo o
            WHERE o.cuadrilla_id = NEW.cuadrilla_id
              AND o.id IS DISTINCT FROM NEW.id
              AND o.inicio < NEW.fin
              AND o.fin    > NEW.inicio
        ) THEN
            RAISE EXCEPTION 'La cuadrilla ya tiene un servicio asignado en este horario.'
                USING ERRCODE = 'exclusion_violation';
        END IF;
    END IF;

    -- quien finaliza la orden debe pertenecer a la cuadrilla asignada (HU-06)
    IF NEW.finalizada_por IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operarios p
                       WHERE p.id = NEW.finalizada_por AND p.cuadrilla_id = NEW.cuadrilla_id) THEN
            RAISE EXCEPTION 'El operario que finaliza la orden no pertenece a la cuadrilla asignada.'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_ordenes_validar
    BEFORE INSERT OR UPDATE ON ordenes_trabajo
    FOR EACH ROW EXECUTE FUNCTION fn_validar_orden();

-- ---------------------------------------------------------------------
-- 8. REGLAS DE NEGOCIO DE LA COTIZACIÓN (OE1, HU-01)
-- precio = (área × tarifa base × factor vegetación × factor frecuencia)
--          + (operarios × costo por operario) + costo de equipos
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_calcular_precio(
    p_area       numeric,
    p_vegetacion integer,
    p_frecuencia integer,
    p_operarios  integer,
    p_equipos    integer[] DEFAULT '{}'
)
RETURNS TABLE (
    tarifa_base        numeric,
    factor_vegetacion  numeric,
    factor_frecuencia  numeric,
    subtotal_area      numeric,
    costo_personal     numeric,
    costo_equipos      numeric,
    precio_total       numeric
)
LANGUAGE sql STABLE AS $$
    WITH p AS (
        SELECT (SELECT valor  FROM parametros_tarifa WHERE clave = 'tarifa_base_m2')  AS tarifa,
               (SELECT valor  FROM parametros_tarifa WHERE clave = 'costo_operario')  AS costo_op,
               (SELECT factor FROM tipos_vegetacion  WHERE id = p_vegetacion)        AS fv,
               (SELECT factor FROM frecuencias       WHERE id = p_frecuencia)        AS ff,
               (SELECT COALESCE(sum(costo_uso), 0) FROM equipos WHERE id = ANY (p_equipos)) AS ceq
    ), c AS (
        SELECT tarifa, fv, ff,
               round(p_area * tarifa * fv * ff, 2)  AS sa,
               round(p_operarios * costo_op, 2)     AS cp,
               ceq
        FROM p
    )
    SELECT tarifa, fv, ff, sa, cp, ceq, sa + cp + ceq FROM c;
$$;

-- El administrador calcula y envía una cotización pendiente (pantalla "Calcular y enviar").
CREATE PROCEDURE sp_calcular_y_enviar_cotizacion(p_cotizacion_id integer, p_equipos integer[] DEFAULT '{}')
LANGUAGE plpgsql AS $$
DECLARE
    v cotizaciones%ROWTYPE;
    r record;
BEGIN
    SELECT * INTO v FROM cotizaciones WHERE id = p_cotizacion_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La cotización % no existe.', p_cotizacion_id;
    END IF;
    IF v.estado <> 'pendiente' THEN
        RAISE EXCEPTION 'La cotización % ya fue calculada (estado: %).', p_cotizacion_id, v.estado;
    END IF;

    SELECT * INTO r FROM fn_calcular_precio(v.area_m2, v.tipo_vegetacion_id, v.frecuencia_id, v.num_operarios, p_equipos);
    IF r.precio_total IS NULL THEN
        RAISE EXCEPTION 'No se pudo calcular el precio: faltan parámetros de tarifa o los catálogos son inválidos.';
    END IF;

    INSERT INTO cotizacion_equipos (cotizacion_id, equipo_id, costo_aplicado)
    SELECT p_cotizacion_id, e.id, e.costo_uso FROM equipos e WHERE e.id = ANY (p_equipos);

    UPDATE cotizaciones
       SET tarifa_base_aplicada       = r.tarifa_base,
           factor_vegetacion_aplicado = r.factor_vegetacion,
           factor_frecuencia_aplicado = r.factor_frecuencia,
           subtotal_area              = r.subtotal_area,
           costo_personal             = r.costo_personal,
           costo_equipos              = r.costo_equipos,
           precio_total               = r.precio_total,
           estado                     = 'enviada',
           enviada_en                 = now()
     WHERE id = p_cotizacion_id;
END $$;

-- ---------------------------------------------------------------------
-- 9. VISTAS Y REPORTES  (HU-05, HU-07, HU-08)
-- ---------------------------------------------------------------------
-- HU-07: historial de servicios realizados por cliente
CREATE VIEW v_historial_servicios AS
SELECT c.id AS cliente_id, c.nombre AS cliente, z.nombre AS zona, o.id AS orden_id,
       o.tipo_servicio, o.finalizada_en AS fecha_servicio, q.nombre AS cuadrilla, o.nota_finalizacion
FROM ordenes_trabajo o
JOIN zonas z      ON z.id = o.zona_id
JOIN clientes c   ON c.id = z.cliente_id
JOIN cuadrillas q ON q.id = o.cuadrilla_id
WHERE o.estado = 'finalizada';

-- HU-05: órdenes asignadas a la cuadrilla de cada operario con cuenta de usuario
CREATE VIEW v_ordenes_operario AS
SELECT op.usuario_id, op.id AS operario_id, o.id AS orden_id, o.tipo_servicio, z.nombre AS zona,
       z.direccion, o.inicio, o.fin, o.estado
FROM operarios op
JOIN ordenes_trabajo o ON o.cuadrilla_id = op.cuadrilla_id
JOIN zonas z           ON z.id = o.zona_id
WHERE op.usuario_id IS NOT NULL;

-- HU-04: órdenes con su cuadrilla (o "por asignar")
CREATE VIEW v_ordenes_detalle AS
SELECT o.id AS orden_id, c.nombre AS cliente, z.nombre AS zona, o.tipo_servicio, o.inicio, o.fin,
       o.estado, q.nombre AS cuadrilla
FROM ordenes_trabajo o
JOIN zonas z    ON z.id = o.zona_id
JOIN clientes c ON c.id = z.cliente_id
LEFT JOIN cuadrillas q ON q.id = o.cuadrilla_id;

-- HU-02 / HU-01: cotizaciones con cliente y zona
CREATE VIEW v_cotizaciones_detalle AS
SELECT q.id AS cotizacion_id, c.nombre AS cliente, z.nombre AS zona, t.nombre AS vegetacion,
       f.nombre AS frecuencia, q.area_m2, q.num_operarios, q.estado, q.precio_total, q.solicitada_en, q.enviada_en
FROM cotizaciones q
JOIN clientes c         ON c.id = q.cliente_id
JOIN zonas z            ON z.id = q.zona_id
JOIN tipos_vegetacion t ON t.id = q.tipo_vegetacion_id
JOIN frecuencias f      ON f.id = q.frecuencia_id;

-- HU-08: reporte de cotizaciones y servicios por periodo (filtro por fechas y por cliente)
CREATE FUNCTION fn_reporte_periodo(p_desde date, p_hasta date, p_cliente_id integer DEFAULT NULL)
RETURNS TABLE (cliente varchar, cotizaciones_solicitadas bigint, cotizaciones_aceptadas bigint,
               valor_aceptado numeric, servicios_finalizados bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = dpm, pg_temp AS $$
    SELECT c.nombre,
           (SELECT count(*) FROM cotizaciones q
             WHERE q.cliente_id = c.id AND q.solicitada_en >= p_desde AND q.solicitada_en < p_hasta + 1),
           (SELECT count(*) FROM cotizaciones q
             WHERE q.cliente_id = c.id AND q.estado = 'aceptada'
               AND q.solicitada_en >= p_desde AND q.solicitada_en < p_hasta + 1),
           (SELECT COALESCE(sum(q.precio_total), 0) FROM cotizaciones q
             WHERE q.cliente_id = c.id AND q.estado = 'aceptada'
               AND q.solicitada_en >= p_desde AND q.solicitada_en < p_hasta + 1),
           (SELECT count(*) FROM ordenes_trabajo o JOIN zonas z ON z.id = o.zona_id
             WHERE z.cliente_id = c.id AND o.estado = 'finalizada'
               AND o.finalizada_en >= p_desde AND o.finalizada_en < p_hasta + 1)
    FROM clientes c
    WHERE p_cliente_id IS NULL OR c.id = p_cliente_id
    ORDER BY c.nombre;
$$;

-- ---------------------------------------------------------------------
-- 10. PERMISOS: perfiles de acceso a nivel de base de datos  (RNF-04)
-- dpm_app       : rol que usa el servidor de la aplicación (sin DELETE salvo en cotizacion_equipos)
-- dpm_reportes  : solo lectura de vistas y del reporte, sin acceso a usuarios ni a contraseñas
-- Los roles se crean sin LOGIN; el despliegue crea los usuarios con contraseña y los asocia:
--   CREATE ROLE dpm_api LOGIN PASSWORD '...' IN ROLE dpm_app;
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dpm_app')      THEN CREATE ROLE dpm_app NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dpm_reportes') THEN CREATE ROLE dpm_reportes NOLOGIN; END IF;
END $$;

REVOKE ALL ON SCHEMA dpm FROM PUBLIC;
GRANT USAGE ON SCHEMA dpm TO dpm_app, dpm_reportes;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA dpm TO dpm_app;
GRANT DELETE ON cotizacion_equipos TO dpm_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA dpm TO dpm_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA dpm TO dpm_app;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA dpm TO dpm_app;

GRANT SELECT ON v_historial_servicios, v_ordenes_detalle, v_cotizaciones_detalle TO dpm_reportes;
REVOKE EXECUTE ON FUNCTION fn_reporte_periodo(date, date, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION fn_reporte_periodo(date, date, integer) TO dpm_reportes, dpm_app;

-- ---------------------------------------------------------------------
-- 11. COMENTARIOS (alimentan el diccionario de datos)
-- ---------------------------------------------------------------------
COMMENT ON TABLE usuarios IS 'Cuentas de acceso al sistema. Cada persona que ingresa (administrador, cliente u operario) tiene un usuario con un rol.';
COMMENT ON COLUMN usuarios.id IS 'Identificador único del usuario (generado automáticamente).';
COMMENT ON COLUMN usuarios.nombre IS 'Nombre completo de la persona.';
COMMENT ON COLUMN usuarios.correo IS 'Correo electrónico usado para iniciar sesión; es único sin distinguir mayúsculas.';
COMMENT ON COLUMN usuarios.password_hash IS 'Contraseña almacenada como hash (nunca en texto plano), según RNF-02.';
COMMENT ON COLUMN usuarios.rol IS 'Perfil de acceso: administrador, cliente u operario (RNF-04).';
COMMENT ON COLUMN usuarios.activo IS 'Indica si la cuenta puede iniciar sesión. Se desactiva en lugar de borrar.';
COMMENT ON COLUMN usuarios.creado_en IS 'Fecha y hora de creación de la cuenta.';
COMMENT ON TABLE clientes IS 'Empresas o conjuntos a los que DPM SAS presta el servicio. Puede tener o no una cuenta de usuario.';
COMMENT ON COLUMN clientes.id IS 'Identificador único del cliente.';
COMMENT ON COLUMN clientes.usuario_id IS 'Cuenta de usuario del cliente (opcional). Debe ser un usuario con rol cliente.';
COMMENT ON COLUMN clientes.rol_usuario IS 'Columna técnica fija en "cliente"; permite validar el rol del usuario con una llave foránea compuesta.';
COMMENT ON COLUMN clientes.nombre IS 'Nombre o razón social del cliente; es único.';
COMMENT ON COLUMN clientes.tipo IS 'Clasificación del cliente: residencial, comercial o institucional.';
COMMENT ON COLUMN clientes.telefono IS 'Teléfono de contacto.';
COMMENT ON COLUMN clientes.correo_contacto IS 'Correo de contacto del cliente.';
COMMENT ON COLUMN clientes.creado_en IS 'Fecha y hora de registro del cliente.';
COMMENT ON TABLE tipos_vegetacion IS 'Catálogo de tipos de vegetación con el factor que ajusta el precio de la cotización (regla de negocio).';
COMMENT ON COLUMN tipos_vegetacion.id IS 'Identificador único del tipo de vegetación.';
COMMENT ON COLUMN tipos_vegetacion.nombre IS 'Nombre del tipo (césped simple, jardín ornamental, zona arborizada, mixta).';
COMMENT ON COLUMN tipos_vegetacion.factor IS 'Multiplicador del precio por tipo de vegetación; debe ser mayor que cero.';
COMMENT ON COLUMN tipos_vegetacion.activo IS 'Indica si el tipo está disponible para nuevas cotizaciones.';
COMMENT ON TABLE frecuencias IS 'Catálogo de frecuencias del servicio con el factor que ajusta el precio (descuento por recurrencia).';
COMMENT ON COLUMN frecuencias.id IS 'Identificador único de la frecuencia.';
COMMENT ON COLUMN frecuencias.nombre IS 'Nombre de la frecuencia (única vez, mensual, quincenal, semanal).';
COMMENT ON COLUMN frecuencias.factor IS 'Multiplicador del precio por frecuencia; debe ser mayor que cero.';
COMMENT ON COLUMN frecuencias.dias_intervalo IS 'Días entre servicios; vacío para servicios de única vez.';
COMMENT ON COLUMN frecuencias.activo IS 'Indica si la frecuencia está disponible para nuevas cotizaciones.';
COMMENT ON TABLE parametros_tarifa IS 'Parámetros generales de la fórmula de cotización, configurables por el administrador.';
COMMENT ON COLUMN parametros_tarifa.clave IS 'Nombre del parámetro (tarifa_base_m2, costo_operario).';
COMMENT ON COLUMN parametros_tarifa.valor IS 'Valor numérico del parámetro en pesos colombianos; no puede ser negativo.';
COMMENT ON COLUMN parametros_tarifa.descripcion IS 'Explicación de qué representa el parámetro.';
COMMENT ON TABLE equipos IS 'Catálogo de equipos (guadañadora, motosierra, fumigadora) con su costo de uso por servicio.';
COMMENT ON COLUMN equipos.id IS 'Identificador único del equipo.';
COMMENT ON COLUMN equipos.nombre IS 'Nombre del equipo; es único.';
COMMENT ON COLUMN equipos.costo_uso IS 'Costo de usar el equipo en un servicio, en pesos colombianos.';
COMMENT ON COLUMN equipos.activo IS 'Indica si el equipo está disponible para nuevas cotizaciones.';
COMMENT ON TABLE zonas IS 'Predios o zonas verdes de cada cliente que reciben mantenimiento.';
COMMENT ON COLUMN zonas.id IS 'Identificador único de la zona.';
COMMENT ON COLUMN zonas.cliente_id IS 'Cliente propietario de la zona.';
COMMENT ON COLUMN zonas.nombre IS 'Nombre de la zona; es único dentro de cada cliente.';
COMMENT ON COLUMN zonas.direccion IS 'Dirección donde se ubica la zona.';
COMMENT ON COLUMN zonas.area_m2 IS 'Área en metros cuadrados; debe ser mayor que cero.';
COMMENT ON COLUMN zonas.tipo_vegetacion_id IS 'Tipo de vegetación predominante de la zona.';
COMMENT ON COLUMN zonas.creado_en IS 'Fecha y hora de registro de la zona.';
COMMENT ON TABLE cuadrillas IS 'Grupos de operarios que ejecutan los servicios en campo.';
COMMENT ON COLUMN cuadrillas.id IS 'Identificador único de la cuadrilla.';
COMMENT ON COLUMN cuadrillas.nombre IS 'Nombre de la cuadrilla; es único.';
COMMENT ON COLUMN cuadrillas.activa IS 'Indica si la cuadrilla puede recibir nuevas asignaciones.';
COMMENT ON TABLE operarios IS 'Personal de campo. Cada operario pertenece a una cuadrilla; solo algunos tienen cuenta de usuario.';
COMMENT ON COLUMN operarios.id IS 'Identificador único del operario.';
COMMENT ON COLUMN operarios.usuario_id IS 'Cuenta de usuario del operario (opcional). Debe ser un usuario con rol operario.';
COMMENT ON COLUMN operarios.rol_usuario IS 'Columna técnica fija en "operario"; permite validar el rol del usuario con una llave foránea compuesta.';
COMMENT ON COLUMN operarios.nombre IS 'Nombre completo del operario.';
COMMENT ON COLUMN operarios.cuadrilla_id IS 'Cuadrilla a la que pertenece.';
COMMENT ON COLUMN operarios.es_lider IS 'Indica si es el líder de la cuadrilla; solo puede haber uno por cuadrilla.';
COMMENT ON COLUMN operarios.activo IS 'Indica si el operario está en servicio.';
COMMENT ON TABLE cotizaciones IS 'Solicitudes y cotizaciones de servicio. Nace como "pendiente" (sin precio) y, al calcularse, guarda el desglose del precio (HU-01, HU-02).';
COMMENT ON COLUMN cotizaciones.id IS 'Identificador único de la cotización.';
COMMENT ON COLUMN cotizaciones.cliente_id IS 'Cliente que solicita la cotización.';
COMMENT ON COLUMN cotizaciones.zona_id IS 'Zona a cotizar; debe pertenecer al mismo cliente.';
COMMENT ON COLUMN cotizaciones.area_m2 IS 'Área en metros cuadrados usada para calcular el precio.';
COMMENT ON COLUMN cotizaciones.tipo_vegetacion_id IS 'Tipo de vegetación considerado en el cálculo.';
COMMENT ON COLUMN cotizaciones.frecuencia_id IS 'Frecuencia del servicio considerada en el cálculo.';
COMMENT ON COLUMN cotizaciones.num_operarios IS 'Número de operarios requeridos (entre 1 y 50).';
COMMENT ON COLUMN cotizaciones.observaciones IS 'Comentarios adicionales del cliente o del administrador.';
COMMENT ON COLUMN cotizaciones.estado IS 'Estado: pendiente, enviada, aceptada o rechazada. Es pendiente si y solo si no tiene precio.';
COMMENT ON COLUMN cotizaciones.tarifa_base_aplicada IS 'Tarifa base por m² vigente cuando se calculó el precio (copia histórica).';
COMMENT ON COLUMN cotizaciones.factor_vegetacion_aplicado IS 'Factor de vegetación vigente cuando se calculó (copia histórica).';
COMMENT ON COLUMN cotizaciones.factor_frecuencia_aplicado IS 'Factor de frecuencia vigente cuando se calculó (copia histórica).';
COMMENT ON COLUMN cotizaciones.subtotal_area IS 'Área × tarifa base × factor de vegetación × factor de frecuencia.';
COMMENT ON COLUMN cotizaciones.costo_personal IS 'Número de operarios × costo por operario.';
COMMENT ON COLUMN cotizaciones.costo_equipos IS 'Suma del costo de los equipos requeridos.';
COMMENT ON COLUMN cotizaciones.precio_total IS 'Precio final: subtotal por área + costo de personal + costo de equipos.';
COMMENT ON COLUMN cotizaciones.creada_por IS 'Usuario que registró la solicitud (cliente o administrador).';
COMMENT ON COLUMN cotizaciones.solicitada_en IS 'Fecha y hora de la solicitud.';
COMMENT ON COLUMN cotizaciones.enviada_en IS 'Fecha y hora en que se calculó y envió el precio al cliente.';
COMMENT ON TABLE cotizacion_equipos IS 'Equipos incluidos en cada cotización, con el costo aplicado en ese momento.';
COMMENT ON COLUMN cotizacion_equipos.cotizacion_id IS 'Cotización a la que pertenece.';
COMMENT ON COLUMN cotizacion_equipos.equipo_id IS 'Equipo incluido.';
COMMENT ON COLUMN cotizacion_equipos.costo_aplicado IS 'Costo del equipo vigente al calcular la cotización (copia histórica).';
COMMENT ON TABLE ordenes_trabajo IS 'Servicios programados y ejecutados: fecha, cuadrilla, estado y registro de finalización (HU-03 a HU-07).';
COMMENT ON COLUMN ordenes_trabajo.id IS 'Identificador único de la orden de trabajo.';
COMMENT ON COLUMN ordenes_trabajo.cotizacion_id IS 'Cotización aceptada de la que proviene la orden (opcional).';
COMMENT ON COLUMN ordenes_trabajo.zona_id IS 'Zona donde se ejecuta el servicio.';
COMMENT ON COLUMN ordenes_trabajo.tipo_servicio IS 'Descripción del servicio (por ejemplo, corte de césped y perfilado).';
COMMENT ON COLUMN ordenes_trabajo.cuadrilla_id IS 'Cuadrilla asignada; vacío mientras la orden está por asignar.';
COMMENT ON COLUMN ordenes_trabajo.inicio IS 'Fecha y hora programadas de inicio.';
COMMENT ON COLUMN ordenes_trabajo.fin IS 'Fecha y hora programadas de finalización; debe ser posterior al inicio.';
COMMENT ON COLUMN ordenes_trabajo.estado IS 'Estado: pendiente, en_ejecucion o finalizada.';
COMMENT ON COLUMN ordenes_trabajo.iniciada_en IS 'Fecha y hora reales en que el operario inició el servicio.';
COMMENT ON COLUMN ordenes_trabajo.finalizada_en IS 'Fecha y hora reales de finalización (HU-06).';
COMMENT ON COLUMN ordenes_trabajo.finalizada_por IS 'Operario que marcó la orden como finalizada (HU-06); debe ser de la cuadrilla asignada.';
COMMENT ON COLUMN ordenes_trabajo.nota_finalizacion IS 'Nota opcional del operario al finalizar (por ejemplo, novedades o incidencias).';
COMMENT ON COLUMN ordenes_trabajo.creado_en IS 'Fecha y hora de creación de la orden.';