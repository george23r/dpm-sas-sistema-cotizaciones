-- =====================================================================
-- DPM SAS — Sistema de información web para la gestión de cotizaciones,
-- programación de servicios y control de jornadas
-- Base de datos: PostgreSQL 14 o superior (probado en PostgreSQL 16)
-- Archivo: 01_schema.sql  (esquema, restricciones, índices, funciones,
--                          procedimientos, vistas, permisos y comentarios)
-- Trabajo de Grado I — Corte 2 — Objetivo específico 2 (diseño) — Versión 2
--
-- Uso:  psql -d <base_de_datos> -v ON_ERROR_STOP=1 -f 01_schema.sql
-- ATENCIÓN: el script borra y recrea el esquema "dpm" (entorno de desarrollo).
--
-- El modelo refleja la entrevista con DPM SAS (23 y 24 de octubre de 2026):
--  * la cotización se arma por líneas (concepto, cantidad, valor unitario),
--    después de una visita técnica, y se envía primero como borrador;
--  * incluye forma de pago por hitos y vigencia (15 días);
--  * las jornadas se registran en planillas que se comparan antes de facturar.
-- =====================================================================

DROP SCHEMA IF EXISTS dpm CASCADE;
CREATE SCHEMA dpm;
SET search_path = dpm, public;

-- ---------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- ---------------------------------------------------------------------
CREATE TYPE rol_usuario       AS ENUM ('administrador', 'cliente', 'operario');
CREATE TYPE tipo_cliente      AS ENUM ('residencial', 'comercial', 'institucional', 'agricola');
CREATE TYPE estado_cotizacion AS ENUM ('solicitada', 'borrador', 'enviada', 'aceptada', 'rechazada');
CREATE TYPE estado_orden      AS ENUM ('pendiente', 'en_ejecucion', 'finalizada');
CREATE TYPE tipo_costo        AS ENUM ('mano_obra', 'maquinaria', 'herramientas', 'combustible', 'transporte', 'otro');
CREATE TYPE origen_planilla   AS ENUM ('campo', 'administrativa');
CREATE TYPE estado_planilla   AS ENUM ('borrador', 'en_comparacion', 'conciliada');

-- ---------------------------------------------------------------------
-- 2. USUARIOS Y PERFILES  (RNF-02, RNF-04)
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
    CONSTRAINT uq_usuarios_id_rol UNIQUE (id, rol)
);
CREATE UNIQUE INDEX uq_usuarios_correo ON usuarios (lower(correo));

CREATE TABLE clientes (
    id               integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id       integer,
    rol_usuario      rol_usuario  NOT NULL DEFAULT 'cliente',
    nombre           varchar(150) NOT NULL,
    nit              varchar(20),
    tipo             tipo_cliente NOT NULL,
    telefono         varchar(30),
    correo_contacto  varchar(160),
    creado_en        timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_clientes_usuario  UNIQUE (usuario_id),
    CONSTRAINT uq_clientes_nombre   UNIQUE (nombre),
    CONSTRAINT ck_clientes_rol      CHECK (rol_usuario = 'cliente'),
    CONSTRAINT fk_clientes_usuario  FOREIGN KEY (usuario_id, rol_usuario) REFERENCES usuarios (id, rol)
);
CREATE UNIQUE INDEX uq_clientes_nit ON clientes (nit) WHERE nit IS NOT NULL;

-- ---------------------------------------------------------------------
-- 3. CATÁLOGO DE SERVICIOS Y SITIOS DE TRABAJO
-- ---------------------------------------------------------------------
CREATE TABLE servicios (
    id           smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre       varchar(100) NOT NULL UNIQUE,
    unidad_cobro varchar(30)  NOT NULL,
    activo       boolean      NOT NULL DEFAULT true
);

CREATE TABLE zonas (
    id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id  integer       NOT NULL REFERENCES clientes (id),
    nombre      varchar(120)  NOT NULL,
    direccion   varchar(200),
    area_m2     numeric(10,2) CHECK (area_m2 > 0),
    descripcion varchar(300),
    creado_en   timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT uq_zonas_cliente_nombre UNIQUE (cliente_id, nombre),
    CONSTRAINT uq_zonas_id_cliente     UNIQUE (id, cliente_id)
);

-- ---------------------------------------------------------------------
-- 4. CUADRILLAS Y OPERARIOS  (HU-04, HU-05)
-- ---------------------------------------------------------------------
CREATE TABLE cuadrillas (
    id      smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre  varchar(80) NOT NULL UNIQUE,
    activa  boolean     NOT NULL DEFAULT true
);

CREATE TABLE operarios (
    id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id   integer,
    rol_usuario  rol_usuario  NOT NULL DEFAULT 'operario',
    nombre       varchar(120) NOT NULL,
    cuadrilla_id smallint     NOT NULL REFERENCES cuadrillas (id),
    es_lider     boolean      NOT NULL DEFAULT false,
    activo       boolean      NOT NULL DEFAULT true,
    CONSTRAINT uq_operarios_usuario UNIQUE (usuario_id),
    CONSTRAINT ck_operarios_rol     CHECK (rol_usuario = 'operario'),
    CONSTRAINT fk_operarios_usuario FOREIGN KEY (usuario_id, rol_usuario) REFERENCES usuarios (id, rol)
);
CREATE UNIQUE INDEX uq_operarios_un_lider_por_cuadrilla ON operarios (cuadrilla_id) WHERE es_lider;
CREATE INDEX ix_operarios_cuadrilla ON operarios (cuadrilla_id);

-- ---------------------------------------------------------------------
-- 5. COTIZACIONES  (HU-01, HU-02)
-- Flujo: solicitada -> borrador (tras la visita técnica) -> enviada -> aceptada | rechazada
-- ---------------------------------------------------------------------
CREATE SEQUENCE seq_consecutivo_cotizacion START 1;

CREATE TABLE cotizaciones (
    id               integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    consecutivo      varchar(20) NOT NULL DEFAULT ('COT-' || lpad(nextval('dpm.seq_consecutivo_cotizacion')::text, 4, '0')),
    cliente_id       integer     NOT NULL,
    zona_id          integer     NOT NULL,
    objeto           text        NOT NULL,
    alcance          text,
    incluye          text,
    tiempo_ejecucion varchar(200),
    observaciones    text,
    vigencia_dias    smallint    NOT NULL DEFAULT 15 CHECK (vigencia_dias > 0),
    estado           estado_cotizacion NOT NULL DEFAULT 'solicitada',
    total            numeric(16,2),
    creada_por       integer     NOT NULL REFERENCES usuarios (id),
    solicitada_en    timestamptz NOT NULL DEFAULT now(),
    enviada_en       timestamptz,
    CONSTRAINT uq_cotizaciones_consecutivo UNIQUE (consecutivo),
    CONSTRAINT fk_cotizaciones_zona_cliente FOREIGN KEY (zona_id, cliente_id) REFERENCES zonas (id, cliente_id),
    -- una cotización enviada (o respondida) tiene fecha de envío y total mayor que cero (HU-01)
    CONSTRAINT ck_cotizaciones_envio CHECK (
        (estado IN ('solicitada', 'borrador') AND enviada_en IS NULL)
        OR
        (estado IN ('enviada', 'aceptada', 'rechazada') AND enviada_en IS NOT NULL AND total IS NOT NULL AND total > 0)
    ),
    CONSTRAINT ck_cotizaciones_fechas CHECK (enviada_en IS NULL OR enviada_en >= solicitada_en)
);
CREATE INDEX ix_cotizaciones_cliente_estado ON cotizaciones (cliente_id, estado);
CREATE INDEX ix_cotizaciones_estado_fecha   ON cotizaciones (estado, solicitada_en DESC);
CREATE INDEX ix_cotizaciones_zona           ON cotizaciones (zona_id);

-- Visita técnica previa a la cotización (entrevista: "primero toca ir a hacer la visita técnica")
CREATE TABLE visitas_tecnicas (
    id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cotizacion_id  integer NOT NULL REFERENCES cotizaciones (id) ON DELETE CASCADE,
    fecha          date    NOT NULL,
    realizada_por  integer NOT NULL REFERENCES usuarios (id),
    observaciones  text
);
CREATE INDEX ix_visitas_cotizacion ON visitas_tecnicas (cotizacion_id);

-- Líneas que ve el cliente: concepto, cantidad, valor unitario y valor total
CREATE TABLE cotizacion_lineas (
    id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cotizacion_id   integer       NOT NULL REFERENCES cotizaciones (id) ON DELETE CASCADE,
    servicio_id     smallint      REFERENCES servicios (id),
    concepto        varchar(200)  NOT NULL,
    cantidad        numeric(12,2) NOT NULL CHECK (cantidad > 0),
    valor_unitario  numeric(14,2) NOT NULL CHECK (valor_unitario >= 0),
    valor_total     numeric(16,2) GENERATED ALWAYS AS (round(cantidad * valor_unitario, 2)) STORED
);
CREATE INDEX ix_lineas_cotizacion ON cotizacion_lineas (cotizacion_id);

-- Análisis interno de costos del administrador (no se muestra al cliente):
-- mano de obra, maquinaria, herramientas, combustible y transporte
CREATE TABLE cotizacion_costos (
    id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cotizacion_id   integer       NOT NULL REFERENCES cotizaciones (id) ON DELETE CASCADE,
    tipo            tipo_costo    NOT NULL,
    descripcion     varchar(200)  NOT NULL,
    cantidad        numeric(12,2) NOT NULL CHECK (cantidad > 0),
    valor_unitario  numeric(14,2) NOT NULL CHECK (valor_unitario >= 0),
    subtotal        numeric(16,2) GENERATED ALWAYS AS (round(cantidad * valor_unitario, 2)) STORED
);
CREATE INDEX ix_costos_cotizacion ON cotizacion_costos (cotizacion_id);

-- Forma de pago por hitos (anticipo, avance, saldo); los porcentajes deben sumar 100
CREATE TABLE cotizacion_hitos (
    cotizacion_id integer      NOT NULL REFERENCES cotizaciones (id) ON DELETE CASCADE,
    orden         smallint     NOT NULL CHECK (orden > 0),
    descripcion   varchar(200) NOT NULL,
    porcentaje    numeric(5,2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
    PRIMARY KEY (cotizacion_id, orden)
);

-- Mantiene el total de la cotización y bloquea cambios una vez enviada (precio fijo)
CREATE FUNCTION fn_recalcular_total() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_id integer; v_estado estado_cotizacion;
BEGIN
    IF TG_OP = 'DELETE' THEN v_id := OLD.cotizacion_id; ELSE v_id := NEW.cotizacion_id; END IF;
    SELECT estado INTO v_estado FROM cotizaciones WHERE id = v_id;
    IF v_estado IN ('enviada', 'aceptada', 'rechazada') THEN
        RAISE EXCEPTION 'La cotización ya fue enviada: su precio es fijo y no puede modificarse.'
            USING ERRCODE = 'check_violation';
    END IF;
    IF TG_TABLE_NAME = 'cotizacion_lineas' THEN
        UPDATE cotizaciones
           SET total = (SELECT sum(valor_total) FROM cotizacion_lineas WHERE cotizacion_id = v_id)
         WHERE id = v_id;
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_lineas_total AFTER INSERT OR UPDATE OR DELETE ON cotizacion_lineas
    FOR EACH ROW EXECUTE FUNCTION fn_recalcular_total();
CREATE TRIGGER trg_costos_bloqueo AFTER INSERT OR UPDATE OR DELETE ON cotizacion_costos
    FOR EACH ROW EXECUTE FUNCTION fn_recalcular_total();
CREATE TRIGGER trg_hitos_bloqueo AFTER INSERT OR UPDATE OR DELETE ON cotizacion_hitos
    FOR EACH ROW EXECUTE FUNCTION fn_recalcular_total();

-- Envío de la cotización (primero borrador, luego precio definitivo al cliente)
CREATE PROCEDURE sp_enviar_cotizacion(p_cotizacion_id integer)
LANGUAGE plpgsql AS $$
DECLARE v cotizaciones%ROWTYPE; n_lineas integer; suma_hitos numeric;
BEGIN
    SELECT * INTO v FROM cotizaciones WHERE id = p_cotizacion_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'La cotización % no existe.', p_cotizacion_id; END IF;
    IF v.estado NOT IN ('solicitada', 'borrador') THEN
        RAISE EXCEPTION 'La cotización % ya fue enviada (estado: %).', v.consecutivo, v.estado;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM visitas_tecnicas WHERE cotizacion_id = p_cotizacion_id) THEN
        RAISE EXCEPTION 'La cotización % requiere una visita técnica registrada antes de enviarse.', v.consecutivo;
    END IF;
    SELECT count(*) INTO n_lineas FROM cotizacion_lineas WHERE cotizacion_id = p_cotizacion_id;
    IF n_lineas = 0 THEN
        RAISE EXCEPTION 'La cotización % no tiene líneas de valor.', v.consecutivo;
    END IF;
    SELECT COALESCE(sum(porcentaje), 0) INTO suma_hitos FROM cotizacion_hitos WHERE cotizacion_id = p_cotizacion_id;
    IF suma_hitos <> 100 THEN
        RAISE EXCEPTION 'Los hitos de pago deben sumar 100 %% (suman %).', suma_hitos;
    END IF;
    UPDATE cotizaciones SET estado = 'enviada', enviada_en = now() WHERE id = p_cotizacion_id;
END $$;

-- Respuesta del cliente: solo dentro de la vigencia (15 días por defecto)
CREATE PROCEDURE sp_responder_cotizacion(p_cotizacion_id integer, p_acepta boolean)
LANGUAGE plpgsql AS $$
DECLARE v cotizaciones%ROWTYPE;
BEGIN
    SELECT * INTO v FROM cotizaciones WHERE id = p_cotizacion_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'La cotización % no existe.', p_cotizacion_id; END IF;
    IF v.estado <> 'enviada' THEN
        RAISE EXCEPTION 'Solo se puede responder una cotización enviada (estado: %).', v.estado;
    END IF;
    IF v.enviada_en + make_interval(days => v.vigencia_dias) < now() THEN
        RAISE EXCEPTION 'La cotización % venció: su vigencia es de % días.', v.consecutivo, v.vigencia_dias;
    END IF;
    UPDATE cotizaciones
       SET estado = CASE WHEN p_acepta THEN 'aceptada'::estado_cotizacion ELSE 'rechazada'::estado_cotizacion END
     WHERE id = p_cotizacion_id;
END $$;

-- ---------------------------------------------------------------------
-- 6. ÓRDENES DE TRABAJO  (HU-03, HU-04, HU-05, HU-06, HU-07)
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
    CONSTRAINT ck_ordenes_cuadrilla CHECK (estado = 'pendiente' OR cuadrilla_id IS NOT NULL),
    CONSTRAINT ck_ordenes_inicio_real CHECK (estado = 'pendiente' OR iniciada_en IS NOT NULL),
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

-- HU-03: una cuadrilla no puede tener dos servicios en el mismo horario.
-- Una orden solo puede originarse en una cotización aceptada.
-- (Alternativa declarativa con la extensión btree_gist:
--   ALTER TABLE ordenes_trabajo ADD CONSTRAINT ex_ordenes_sin_cruce
--   EXCLUDE USING gist (cuadrilla_id WITH =, tstzrange(inicio, fin) WITH &&) WHERE (cuadrilla_id IS NOT NULL); )
CREATE FUNCTION fn_validar_orden() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.cotizacion_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM cotizaciones c WHERE c.id = NEW.cotizacion_id AND c.estado = 'aceptada') THEN
            RAISE EXCEPTION 'La orden solo puede originarse en una cotización aceptada.'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

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

    IF NEW.finalizada_por IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM operarios p WHERE p.id = NEW.finalizada_por AND p.cuadrilla_id = NEW.cuadrilla_id) THEN
            RAISE EXCEPTION 'El operario que finaliza la orden no pertenece a la cuadrilla asignada.'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_ordenes_validar BEFORE INSERT OR UPDATE ON ordenes_trabajo
    FOR EACH ROW EXECUTE FUNCTION fn_validar_orden();

-- ---------------------------------------------------------------------
-- 7. CONTROL DE JORNADAS: planillas de apuntamiento y comparación  (HU-09, HU-10)
-- La planilla de campo (responsable de campo) y la administrativa se comparan
-- antes de facturar, para evitar cobros duplicados.
-- ---------------------------------------------------------------------
CREATE TABLE planillas_jornada (
    id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id     integer         NOT NULL REFERENCES clientes (id),
    periodo_desde  date            NOT NULL,
    periodo_hasta  date            NOT NULL,
    origen         origen_planilla NOT NULL,
    estado         estado_planilla NOT NULL DEFAULT 'borrador',
    registrada_por integer         NOT NULL REFERENCES usuarios (id),
    creado_en      timestamptz     NOT NULL DEFAULT now(),
    CONSTRAINT ck_planillas_periodo CHECK (periodo_hasta >= periodo_desde),
    CONSTRAINT uq_planillas_origen UNIQUE (cliente_id, periodo_desde, periodo_hasta, origen)
);

CREATE TABLE registros_jornada (
    id                 integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    planilla_id        integer      NOT NULL REFERENCES planillas_jornada (id) ON DELETE CASCADE,
    operario_id        integer      NOT NULL REFERENCES operarios (id),
    fecha              date         NOT NULL,
    zona_id            integer      NOT NULL REFERENCES zonas (id),
    centro_costo       varchar(60),
    actividad          varchar(80)  NOT NULL,
    labor              varchar(120) NOT NULL,
    hora_inicio        time         NOT NULL,
    hora_fin           time         NOT NULL,
    descanso_horas     numeric(4,2) NOT NULL DEFAULT 0 CHECK (descanso_horas >= 0),
    -- horas trabajadas; si el turno cruza la medianoche (18:00 a 06:00) suma 24 horas
    horas              numeric(5,2) GENERATED ALWAYS AS (
        round((extract(epoch FROM (hora_fin - hora_inicio)) / 3600.0)::numeric
              + CASE WHEN hora_fin <= hora_inicio THEN 24 ELSE 0 END - descanso_horas, 2)) STORED,
    dominical_festivo  boolean      NOT NULL DEFAULT false,
    CONSTRAINT ck_registros_horas CHECK (hora_inicio <> hora_fin),
    CONSTRAINT uq_registros UNIQUE (planilla_id, operario_id, fecha, hora_inicio)
);
CREATE INDEX ix_registros_planilla_operario ON registros_jornada (planilla_id, operario_id, fecha);

-- Una planilla conciliada no se modifica
CREATE FUNCTION fn_bloquear_planilla_conciliada() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_id integer; v_estado estado_planilla;
BEGIN
    IF TG_OP = 'DELETE' THEN v_id := OLD.planilla_id; ELSE v_id := NEW.planilla_id; END IF;
    SELECT estado INTO v_estado FROM planillas_jornada WHERE id = v_id;
    IF v_estado = 'conciliada' THEN
        RAISE EXCEPTION 'La planilla ya fue conciliada y no puede modificarse.' USING ERRCODE = 'check_violation';
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_registros_bloqueo BEFORE INSERT OR UPDATE OR DELETE ON registros_jornada
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_planilla_conciliada();

-- Comparación por operario y día entre la planilla de campo y la administrativa
CREATE FUNCTION fn_comparar_planillas(p_campo integer, p_admin integer)
RETURNS TABLE (operario varchar, fecha date, horas_campo numeric, horas_admin numeric,
               diferencia numeric, resultado text)
LANGUAGE sql STABLE AS $$
    WITH c AS (SELECT operario_id, fecha, sum(horas) AS h FROM registros_jornada WHERE planilla_id = p_campo GROUP BY 1, 2),
         a AS (SELECT operario_id, fecha, sum(horas) AS h FROM registros_jornada WHERE planilla_id = p_admin GROUP BY 1, 2)
    SELECT o.nombre, COALESCE(c.fecha, a.fecha), c.h, a.h, COALESCE(c.h, 0) - COALESCE(a.h, 0),
           CASE WHEN a.h IS NULL THEN 'solo_campo'
                WHEN c.h IS NULL THEN 'solo_administrativa'
                WHEN c.h = a.h   THEN 'coincide'
                ELSE 'diferente' END
    FROM c FULL JOIN a ON a.operario_id = c.operario_id AND a.fecha = c.fecha
    JOIN operarios o ON o.id = COALESCE(c.operario_id, a.operario_id)
    ORDER BY 2, 1;
$$;

-- Solo se concilian planillas del mismo cliente y periodo, sin diferencias
CREATE PROCEDURE sp_conciliar_planillas(p_campo integer, p_admin integer)
LANGUAGE plpgsql AS $$
DECLARE pc planillas_jornada%ROWTYPE; pa planillas_jornada%ROWTYPE; n_dif integer;
BEGIN
    SELECT * INTO pc FROM planillas_jornada WHERE id = p_campo FOR UPDATE;
    SELECT * INTO pa FROM planillas_jornada WHERE id = p_admin FOR UPDATE;
    IF pc.id IS NULL OR pa.id IS NULL THEN RAISE EXCEPTION 'Alguna de las planillas no existe.'; END IF;
    IF pc.origen <> 'campo' OR pa.origen <> 'administrativa' THEN
        RAISE EXCEPTION 'Se debe comparar una planilla de campo con una administrativa.';
    END IF;
    IF pc.cliente_id <> pa.cliente_id OR pc.periodo_desde <> pa.periodo_desde OR pc.periodo_hasta <> pa.periodo_hasta THEN
        RAISE EXCEPTION 'Las planillas deben ser del mismo cliente y periodo.';
    END IF;
    SELECT count(*) INTO n_dif FROM fn_comparar_planillas(p_campo, p_admin) WHERE resultado <> 'coincide';
    IF n_dif > 0 THEN
        UPDATE planillas_jornada SET estado = 'en_comparacion' WHERE id IN (p_campo, p_admin);
        RAISE EXCEPTION 'Existen % diferencias entre las planillas; deben corregirse antes de facturar.', n_dif;
    END IF;
    UPDATE planillas_jornada SET estado = 'conciliada' WHERE id IN (p_campo, p_admin);
END $$;

-- ---------------------------------------------------------------------
-- 8. VISTAS Y REPORTES  (HU-02, HU-04, HU-05, HU-07, HU-08)
-- ---------------------------------------------------------------------
CREATE VIEW v_historial_servicios AS
SELECT c.id AS cliente_id, c.nombre AS cliente, z.nombre AS zona, o.id AS orden_id,
       o.tipo_servicio, o.finalizada_en AS fecha_servicio, q.nombre AS cuadrilla, o.nota_finalizacion
FROM ordenes_trabajo o
JOIN zonas z      ON z.id = o.zona_id
JOIN clientes c   ON c.id = z.cliente_id
JOIN cuadrillas q ON q.id = o.cuadrilla_id
WHERE o.estado = 'finalizada';

CREATE VIEW v_ordenes_operario AS
SELECT op.usuario_id, op.id AS operario_id, o.id AS orden_id, o.tipo_servicio, z.nombre AS zona,
       z.direccion, o.inicio, o.fin, o.estado
FROM operarios op
JOIN ordenes_trabajo o ON o.cuadrilla_id = op.cuadrilla_id
JOIN zonas z           ON z.id = o.zona_id
WHERE op.usuario_id IS NOT NULL;

CREATE VIEW v_ordenes_detalle AS
SELECT o.id AS orden_id, c.nombre AS cliente, z.nombre AS zona, o.tipo_servicio, o.inicio, o.fin,
       o.estado, q.nombre AS cuadrilla
FROM ordenes_trabajo o
JOIN zonas z    ON z.id = o.zona_id
JOIN clientes c ON c.id = z.cliente_id
LEFT JOIN cuadrillas q ON q.id = o.cuadrilla_id;

-- Vista para el cliente: no incluye el análisis interno de costos
CREATE VIEW v_cotizaciones_detalle AS
SELECT q.id AS cotizacion_id, q.consecutivo, c.nombre AS cliente, z.nombre AS zona, q.objeto, q.estado, q.total,
       q.vigencia_dias, q.enviada_en,
       CASE WHEN q.enviada_en IS NULL THEN NULL
            ELSE (q.enviada_en + make_interval(days => q.vigencia_dias))::date END AS vence_el,
       q.solicitada_en
FROM cotizaciones q
JOIN clientes c ON c.id = q.cliente_id
JOIN zonas z    ON z.id = q.zona_id;

-- Vista interna del administrador: costo estimado frente al precio ofrecido
CREATE VIEW v_cotizacion_costo_vs_precio AS
SELECT q.id AS cotizacion_id, q.consecutivo, q.estado, q.total AS precio,
       COALESCE((SELECT sum(k.subtotal) FROM cotizacion_costos k WHERE k.cotizacion_id = q.id), 0) AS costo_estimado,
       q.total - COALESCE((SELECT sum(k.subtotal) FROM cotizacion_costos k WHERE k.cotizacion_id = q.id), 0) AS diferencia
FROM cotizaciones q;

-- HU-08: reporte por periodo y cliente
CREATE FUNCTION fn_reporte_periodo(p_desde date, p_hasta date, p_cliente_id integer DEFAULT NULL)
RETURNS TABLE (cliente varchar, cotizaciones_solicitadas bigint, cotizaciones_aceptadas bigint,
               valor_aceptado numeric, servicios_finalizados bigint, horas_registradas numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = dpm, pg_temp AS $$
    SELECT c.nombre,
           (SELECT count(*) FROM cotizaciones q
             WHERE q.cliente_id = c.id AND q.solicitada_en >= p_desde AND q.solicitada_en < p_hasta + 1),
           (SELECT count(*) FROM cotizaciones q
             WHERE q.cliente_id = c.id AND q.estado = 'aceptada'
               AND q.solicitada_en >= p_desde AND q.solicitada_en < p_hasta + 1),
           (SELECT COALESCE(sum(q.total), 0) FROM cotizaciones q
             WHERE q.cliente_id = c.id AND q.estado = 'aceptada'
               AND q.solicitada_en >= p_desde AND q.solicitada_en < p_hasta + 1),
           (SELECT count(*) FROM ordenes_trabajo o JOIN zonas z ON z.id = o.zona_id
             WHERE z.cliente_id = c.id AND o.estado = 'finalizada'
               AND o.finalizada_en >= p_desde AND o.finalizada_en < p_hasta + 1),
           (SELECT COALESCE(sum(r.horas), 0) FROM registros_jornada r
             JOIN planillas_jornada p ON p.id = r.planilla_id
             WHERE p.cliente_id = c.id AND p.origen = 'campo' AND r.fecha BETWEEN p_desde AND p_hasta)
    FROM clientes c
    WHERE p_cliente_id IS NULL OR c.id = p_cliente_id
    ORDER BY c.nombre;
$$;

-- ---------------------------------------------------------------------
-- 9. PERMISOS: perfiles de acceso a nivel de base de datos  (RNF-04)
-- dpm_app       : rol del servidor de la aplicación (sin DELETE salvo en tablas de detalle)
-- dpm_reportes  : solo lectura de vistas y del reporte; sin acceso a usuarios ni a costos internos
-- Los roles se crean sin LOGIN; el despliegue crea los usuarios de conexión:
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
GRANT DELETE ON cotizacion_lineas, cotizacion_costos, cotizacion_hitos, registros_jornada TO dpm_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA dpm TO dpm_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA dpm TO dpm_app;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA dpm TO dpm_app;

GRANT SELECT ON v_historial_servicios, v_ordenes_detalle, v_cotizaciones_detalle TO dpm_reportes;
REVOKE EXECUTE ON FUNCTION fn_reporte_periodo(date, date, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION fn_reporte_periodo(date, date, integer) TO dpm_reportes, dpm_app;

-- ---------------------------------------------------------------------
-- 10. COMENTARIOS (alimentan el diccionario de datos)
-- ---------------------------------------------------------------------
COMMENT ON TABLE usuarios IS 'Cuentas de acceso al sistema. Cada persona que ingresa (administrador, cliente u operario) tiene un usuario con un rol.';
COMMENT ON COLUMN usuarios.id IS 'Identificador único del usuario.';
COMMENT ON COLUMN usuarios.nombre IS 'Nombre completo de la persona.';
COMMENT ON COLUMN usuarios.correo IS 'Correo para iniciar sesión; es único sin distinguir mayúsculas.';
COMMENT ON COLUMN usuarios.password_hash IS 'Contraseña almacenada como hash, nunca en texto plano (RNF-02).';
COMMENT ON COLUMN usuarios.rol IS 'Perfil de acceso: administrador, cliente u operario (RNF-04).';
COMMENT ON COLUMN usuarios.activo IS 'Indica si la cuenta puede iniciar sesión; se desactiva en lugar de borrar.';
COMMENT ON COLUMN usuarios.creado_en IS 'Fecha y hora de creación de la cuenta.';
COMMENT ON TABLE clientes IS 'Contratantes de DPM SAS (haciendas, conjuntos, empresas, colegios). Pueden tener o no una cuenta de usuario.';
COMMENT ON COLUMN clientes.id IS 'Identificador único del cliente.';
COMMENT ON COLUMN clientes.usuario_id IS 'Cuenta de usuario del cliente (opcional); debe tener rol cliente.';
COMMENT ON COLUMN clientes.rol_usuario IS 'Columna técnica fija en "cliente"; permite validar el rol del usuario con una llave foránea compuesta.';
COMMENT ON COLUMN clientes.nombre IS 'Nombre o razón social; es único.';
COMMENT ON COLUMN clientes.nit IS 'NIT del cliente (opcional); es único cuando existe.';
COMMENT ON COLUMN clientes.tipo IS 'Clasificación: residencial, comercial, institucional o agrícola.';
COMMENT ON COLUMN clientes.telefono IS 'Teléfono de contacto.';
COMMENT ON COLUMN clientes.correo_contacto IS 'Correo de contacto del cliente.';
COMMENT ON COLUMN clientes.creado_en IS 'Fecha y hora de registro del cliente.';
COMMENT ON TABLE servicios IS 'Catálogo de los servicios que ofrece DPM SAS (poda de árboles, resiembra, riego, fumigación, etc.).';
COMMENT ON COLUMN servicios.id IS 'Identificador único del servicio.';
COMMENT ON COLUMN servicios.nombre IS 'Nombre del servicio; es único.';
COMMENT ON COLUMN servicios.unidad_cobro IS 'Unidad en que se cobra el servicio (árbol, m², jornada, global); por confirmar con DPM SAS.';
COMMENT ON COLUMN servicios.activo IS 'Indica si el servicio está disponible para nuevas cotizaciones.';
COMMENT ON TABLE zonas IS 'Sitios de trabajo de cada cliente: predios, zonas verdes o lotes.';
COMMENT ON COLUMN zonas.id IS 'Identificador único de la zona.';
COMMENT ON COLUMN zonas.cliente_id IS 'Cliente al que pertenece la zona.';
COMMENT ON COLUMN zonas.nombre IS 'Nombre de la zona o lote; es único dentro de cada cliente.';
COMMENT ON COLUMN zonas.direccion IS 'Dirección o ubicación de la zona.';
COMMENT ON COLUMN zonas.area_m2 IS 'Área en metros cuadrados (opcional); mayor que cero cuando existe.';
COMMENT ON COLUMN zonas.descripcion IS 'Descripción breve de la zona.';
COMMENT ON COLUMN zonas.creado_en IS 'Fecha y hora de registro de la zona.';
COMMENT ON TABLE cuadrillas IS 'Grupos de operarios que ejecutan los servicios en campo.';
COMMENT ON COLUMN cuadrillas.id IS 'Identificador único de la cuadrilla.';
COMMENT ON COLUMN cuadrillas.nombre IS 'Nombre de la cuadrilla; es único.';
COMMENT ON COLUMN cuadrillas.activa IS 'Indica si la cuadrilla puede recibir nuevas asignaciones.';
COMMENT ON TABLE operarios IS 'Trabajadores de campo. Cada uno pertenece a una cuadrilla; solo algunos tienen cuenta de usuario.';
COMMENT ON COLUMN operarios.id IS 'Identificador único del operario.';
COMMENT ON COLUMN operarios.usuario_id IS 'Cuenta de usuario del operario (opcional); debe tener rol operario.';
COMMENT ON COLUMN operarios.rol_usuario IS 'Columna técnica fija en "operario"; permite validar el rol del usuario con una llave foránea compuesta.';
COMMENT ON COLUMN operarios.nombre IS 'Nombre completo del operario.';
COMMENT ON COLUMN operarios.cuadrilla_id IS 'Cuadrilla a la que pertenece.';
COMMENT ON COLUMN operarios.es_lider IS 'Indica si es el líder de la cuadrilla; solo puede haber uno por cuadrilla.';
COMMENT ON COLUMN operarios.activo IS 'Indica si el operario está en servicio.';
COMMENT ON TABLE cotizaciones IS 'Cotizaciones de servicio. Nacen como solicitud, se arman en borrador tras la visita técnica y se envían al cliente con precio fijo y vigencia (HU-01, HU-02).';
COMMENT ON COLUMN cotizaciones.id IS 'Identificador único de la cotización.';
COMMENT ON COLUMN cotizaciones.consecutivo IS 'Número de la cotización (por ejemplo, COT-0001); se asigna automáticamente.';
COMMENT ON COLUMN cotizaciones.cliente_id IS 'Cliente que solicita o recibe la cotización.';
COMMENT ON COLUMN cotizaciones.zona_id IS 'Zona del servicio; debe pertenecer al mismo cliente.';
COMMENT ON COLUMN cotizaciones.objeto IS 'Objeto de la cotización: descripción del servicio a prestar.';
COMMENT ON COLUMN cotizaciones.alcance IS 'Alcance técnico: actividades que se realizarán.';
COMMENT ON COLUMN cotizaciones.incluye IS 'Qué incluye el servicio (personal, herramientas, insumos, transporte, seguridad).';
COMMENT ON COLUMN cotizaciones.tiempo_ejecucion IS 'Tiempo de ejecución, que se coordina con el cliente.';
COMMENT ON COLUMN cotizaciones.observaciones IS 'Condiciones y observaciones adicionales.';
COMMENT ON COLUMN cotizaciones.vigencia_dias IS 'Días de vigencia de la cotización desde su envío (15 por defecto).';
COMMENT ON COLUMN cotizaciones.estado IS 'Estado: solicitada, borrador, enviada, aceptada o rechazada.';
COMMENT ON COLUMN cotizaciones.total IS 'Total de la cotización; se calcula como la suma de sus líneas.';
COMMENT ON COLUMN cotizaciones.creada_por IS 'Usuario que registró la solicitud o la cotización.';
COMMENT ON COLUMN cotizaciones.solicitada_en IS 'Fecha y hora de la solicitud.';
COMMENT ON COLUMN cotizaciones.enviada_en IS 'Fecha y hora de envío al cliente; desde ese momento el precio es fijo.';
COMMENT ON TABLE visitas_tecnicas IS 'Visita técnica previa a la cotización, para conocer lo que necesita el cliente.';
COMMENT ON COLUMN visitas_tecnicas.id IS 'Identificador único de la visita.';
COMMENT ON COLUMN visitas_tecnicas.cotizacion_id IS 'Cotización a la que corresponde la visita.';
COMMENT ON COLUMN visitas_tecnicas.fecha IS 'Fecha en que se realizó la visita.';
COMMENT ON COLUMN visitas_tecnicas.realizada_por IS 'Usuario que realizó la visita.';
COMMENT ON COLUMN visitas_tecnicas.observaciones IS 'Observaciones de la visita.';
COMMENT ON TABLE cotizacion_lineas IS 'Líneas de valor que ve el cliente: concepto, cantidad, valor unitario y valor total.';
COMMENT ON COLUMN cotizacion_lineas.id IS 'Identificador único de la línea.';
COMMENT ON COLUMN cotizacion_lineas.cotizacion_id IS 'Cotización a la que pertenece.';
COMMENT ON COLUMN cotizacion_lineas.servicio_id IS 'Servicio del catálogo asociado (opcional).';
COMMENT ON COLUMN cotizacion_lineas.concepto IS 'Descripción del concepto cobrado.';
COMMENT ON COLUMN cotizacion_lineas.cantidad IS 'Cantidad de unidades (árboles, metros cuadrados, jornadas, etc.); mayor que cero.';
COMMENT ON COLUMN cotizacion_lineas.valor_unitario IS 'Valor de cada unidad en pesos colombianos.';
COMMENT ON COLUMN cotizacion_lineas.valor_total IS 'Cantidad por valor unitario; se calcula automáticamente.';
COMMENT ON TABLE cotizacion_costos IS 'Análisis interno de costos del administrador (mano de obra, maquinaria, combustible, transporte); no lo ve el cliente.';
COMMENT ON COLUMN cotizacion_costos.id IS 'Identificador único del costo.';
COMMENT ON COLUMN cotizacion_costos.cotizacion_id IS 'Cotización a la que pertenece.';
COMMENT ON COLUMN cotizacion_costos.tipo IS 'Tipo de costo: mano de obra, maquinaria, herramientas, combustible, transporte u otro.';
COMMENT ON COLUMN cotizacion_costos.descripcion IS 'Descripción del costo.';
COMMENT ON COLUMN cotizacion_costos.cantidad IS 'Cantidad de unidades (trabajadores por día, galones, viajes, etc.).';
COMMENT ON COLUMN cotizacion_costos.valor_unitario IS 'Valor de cada unidad en pesos colombianos.';
COMMENT ON COLUMN cotizacion_costos.subtotal IS 'Cantidad por valor unitario; se calcula automáticamente.';
COMMENT ON TABLE cotizacion_hitos IS 'Forma de pago por hitos de la cotización (anticipo, avance y saldo); los porcentajes deben sumar 100.';
COMMENT ON COLUMN cotizacion_hitos.cotizacion_id IS 'Cotización a la que pertenece.';
COMMENT ON COLUMN cotizacion_hitos.orden IS 'Número de orden del hito dentro de la cotización.';
COMMENT ON COLUMN cotizacion_hitos.descripcion IS 'Descripción del hito de pago (por ejemplo, anticipo al iniciar).';
COMMENT ON COLUMN cotizacion_hitos.porcentaje IS 'Porcentaje del total que se paga en el hito (mayor que 0 y hasta 100).';
COMMENT ON TABLE ordenes_trabajo IS 'Servicios programados y ejecutados: horario, cuadrilla, estado y registro de finalización (HU-03 a HU-07).';
COMMENT ON COLUMN ordenes_trabajo.id IS 'Identificador único de la orden de trabajo.';
COMMENT ON COLUMN ordenes_trabajo.cotizacion_id IS 'Cotización aceptada de la que proviene la orden (opcional).';
COMMENT ON COLUMN ordenes_trabajo.zona_id IS 'Zona donde se ejecuta el servicio.';
COMMENT ON COLUMN ordenes_trabajo.tipo_servicio IS 'Descripción del servicio a ejecutar.';
COMMENT ON COLUMN ordenes_trabajo.cuadrilla_id IS 'Cuadrilla asignada; vacío mientras la orden está por asignar.';
COMMENT ON COLUMN ordenes_trabajo.inicio IS 'Fecha y hora programadas de inicio.';
COMMENT ON COLUMN ordenes_trabajo.fin IS 'Fecha y hora programadas de finalización; posterior al inicio.';
COMMENT ON COLUMN ordenes_trabajo.estado IS 'Estado: pendiente, en_ejecucion o finalizada.';
COMMENT ON COLUMN ordenes_trabajo.iniciada_en IS 'Fecha y hora reales de inicio del servicio.';
COMMENT ON COLUMN ordenes_trabajo.finalizada_en IS 'Fecha y hora reales de finalización (HU-06).';
COMMENT ON COLUMN ordenes_trabajo.finalizada_por IS 'Operario que finalizó la orden; debe ser de la cuadrilla asignada (HU-06).';
COMMENT ON COLUMN ordenes_trabajo.nota_finalizacion IS 'Nota opcional del operario al finalizar (novedades o incidencias).';
COMMENT ON COLUMN ordenes_trabajo.creado_en IS 'Fecha y hora de creación de la orden.';
COMMENT ON TABLE planillas_jornada IS 'Planillas de apuntamiento de labores de un cliente en un periodo: la de campo y la administrativa, que se comparan antes de facturar (HU-09, HU-10).';
COMMENT ON COLUMN planillas_jornada.id IS 'Identificador único de la planilla.';
COMMENT ON COLUMN planillas_jornada.cliente_id IS 'Cliente al que corresponde la planilla.';
COMMENT ON COLUMN planillas_jornada.periodo_desde IS 'Primer día del periodo de la planilla.';
COMMENT ON COLUMN planillas_jornada.periodo_hasta IS 'Último día del periodo; no anterior al primero.';
COMMENT ON COLUMN planillas_jornada.origen IS 'Origen de la planilla: campo (responsable de campo) o administrativa.';
COMMENT ON COLUMN planillas_jornada.estado IS 'Estado: borrador, en_comparacion o conciliada; una planilla conciliada no se modifica.';
COMMENT ON COLUMN planillas_jornada.registrada_por IS 'Usuario que registró la planilla.';
COMMENT ON COLUMN planillas_jornada.creado_en IS 'Fecha y hora de creación de la planilla.';
COMMENT ON TABLE registros_jornada IS 'Registros de turno por trabajador y día: lote, actividad, labor, hora de inicio y fin y horas trabajadas.';
COMMENT ON COLUMN registros_jornada.id IS 'Identificador único del registro.';
COMMENT ON COLUMN registros_jornada.planilla_id IS 'Planilla a la que pertenece.';
COMMENT ON COLUMN registros_jornada.operario_id IS 'Trabajador que realizó la jornada.';
COMMENT ON COLUMN registros_jornada.fecha IS 'Fecha de la jornada.';
COMMENT ON COLUMN registros_jornada.zona_id IS 'Lote o zona donde se trabajó.';
COMMENT ON COLUMN registros_jornada.centro_costo IS 'Centro de costo de la actividad.';
COMMENT ON COLUMN registros_jornada.actividad IS 'Conjunto de actividades (por ejemplo, riego o resiembra).';
COMMENT ON COLUMN registros_jornada.labor IS 'Labor específica realizada (por ejemplo, motobombero).';
COMMENT ON COLUMN registros_jornada.hora_inicio IS 'Hora de inicio del turno.';
COMMENT ON COLUMN registros_jornada.hora_fin IS 'Hora de fin del turno; si es menor que la de inicio, el turno cruza la medianoche.';
COMMENT ON COLUMN registros_jornada.descanso_horas IS 'Horas de descanso que se descuentan del turno.';
COMMENT ON COLUMN registros_jornada.horas IS 'Horas trabajadas; se calcula automáticamente a partir del turno y el descanso.';
COMMENT ON COLUMN registros_jornada.dominical_festivo IS 'Indica si la jornada fue en domingo o festivo.';