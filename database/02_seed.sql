-- =====================================================================
-- DPM SAS — Datos de prueba
-- Archivo: 02_seed.sql   (ejecutar DESPUÉS de 01_schema.sql)
--
-- IMPORTANTE:
--  * Todos los datos son FICTICIOS (clientes, personas y correos con dominio .example).
--  * Las tarifas y los factores son ILUSTRATIVOS. Deben reemplazarse por los valores
--    reales de DPM SAS una vez realizada la entrevista con el administrador.
--  * Los "password_hash" son marcadores de prueba, NO son hashes reales: la aplicación
--    debe almacenar hashes (p. ej. bcrypt) y nunca contraseñas en texto plano (RNF-02).
-- =====================================================================
SET search_path = dpm, public;
SET TIME ZONE 'America/Bogota';

-- ---------------------------------------------------------------------
-- Parámetros de tarifa y catálogos (reglas de negocio — OE1)
-- ---------------------------------------------------------------------
INSERT INTO parametros_tarifa (clave, valor, descripcion) VALUES
  ('tarifa_base_m2', 350.00,   'Tarifa base por metro cuadrado (COP) — valor ilustrativo'),
  ('costo_operario', 45000.00, 'Costo por operario por servicio (COP) — valor ilustrativo');

INSERT INTO tipos_vegetacion (nombre, factor) VALUES
  ('Césped simple', 1.00), ('Jardín ornamental', 1.30), ('Zona arborizada', 1.60), ('Mixta', 1.80);

INSERT INTO frecuencias (nombre, factor, dias_intervalo) VALUES
  ('Única vez', 1.00, NULL), ('Mensual', 0.90, 30), ('Quincenal', 0.85, 15), ('Semanal', 0.80, 7);

INSERT INTO equipos (nombre, costo_uso) VALUES
  ('Guadañadora', 20000.00), ('Motosierra', 60000.00), ('Fumigadora', 40000.00);

-- ---------------------------------------------------------------------
-- Usuarios (rol y perfil)
-- ---------------------------------------------------------------------
INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES
  ('Administrador DPM',        'admin@dpm.example',         'HASH_DE_PRUEBA_NO_USAR', 'administrador'),
  ('Cliente Los Almendros',    'almendros@cliente.example', 'HASH_DE_PRUEBA_NO_USAR', 'cliente'),
  ('Luis Fernando Gómez',      'luis.gomez@dpm.example',    'HASH_DE_PRUEBA_NO_USAR', 'operario'),
  ('Sandra Milena Rojas',      'sandra.rojas@dpm.example',  'HASH_DE_PRUEBA_NO_USAR', 'operario'),
  ('Camilo Andrés Torres',     'camilo.torres@dpm.example', 'HASH_DE_PRUEBA_NO_USAR', 'operario');

INSERT INTO clientes (usuario_id, nombre, tipo, telefono, correo_contacto) VALUES
  ((SELECT id FROM usuarios WHERE correo = 'almendros@cliente.example'),
        'Conjunto Residencial Los Almendros', 'residencial',   '3000000001', 'almendros@cliente.example'),
  (NULL, 'Unidad Residencial Portal del Bosque', 'residencial',   '3000000002', NULL),
  (NULL, 'Centro Comercial Plaza Mirador',       'comercial',     '3000000003', NULL),
  (NULL, 'Colegio Nuevo Horizonte',              'institucional', '3000000004', NULL);

INSERT INTO zonas (cliente_id, nombre, direccion, area_m2, tipo_vegetacion_id) VALUES
  ((SELECT id FROM clientes WHERE nombre = 'Conjunto Residencial Los Almendros'),
        'Zona común - Torre A', 'Calle 45 # 12-30, Cali', 850,  (SELECT id FROM tipos_vegetacion WHERE nombre = 'Césped simple')),
  ((SELECT id FROM clientes WHERE nombre = 'Conjunto Residencial Los Almendros'),
        'Jardines de ingreso',  'Calle 45 # 12-30, Cali', 220,  (SELECT id FROM tipos_vegetacion WHERE nombre = 'Jardín ornamental')),
  ((SELECT id FROM clientes WHERE nombre = 'Unidad Residencial Portal del Bosque'),
        'Parque interno',       'Carrera 100 # 16-200, Cali', 1600, (SELECT id FROM tipos_vegetacion WHERE nombre = 'Zona arborizada')),
  ((SELECT id FROM clientes WHERE nombre = 'Centro Comercial Plaza Mirador'),
        'Zonas verdes perimetrales', 'Avenida 5N # 20-10, Cali', 3200, (SELECT id FROM tipos_vegetacion WHERE nombre = 'Mixta')),
  ((SELECT id FROM clientes WHERE nombre = 'Colegio Nuevo Horizonte'),
        'Canchas y zonas verdes', 'Calle 9 # 40-15, Cali', 1900, (SELECT id FROM tipos_vegetacion WHERE nombre = 'Césped simple'));

-- ---------------------------------------------------------------------
-- Cuadrillas y operarios (12 integrantes; 3 líderes con cuenta de usuario)
-- ---------------------------------------------------------------------
INSERT INTO cuadrillas (nombre) VALUES ('Cuadrilla Esmeralda'), ('Cuadrilla Follaje'), ('Cuadrilla Raíces');

INSERT INTO operarios (usuario_id, nombre, cuadrilla_id, es_lider) VALUES
  ((SELECT id FROM usuarios WHERE correo = 'luis.gomez@dpm.example'),    'Luis Fernando Gómez',  (SELECT id FROM cuadrillas WHERE nombre = 'Cuadrilla Esmeralda'), true),
  ((SELECT id FROM usuarios WHERE correo = 'sandra.rojas@dpm.example'),  'Sandra Milena Rojas',  (SELECT id FROM cuadrillas WHERE nombre = 'Cuadrilla Follaje'),   true),
  ((SELECT id FROM usuarios WHERE correo = 'camilo.torres@dpm.example'), 'Camilo Andrés Torres', (SELECT id FROM cuadrillas WHERE nombre = 'Cuadrilla Raíces'),    true);

INSERT INTO operarios (nombre, cuadrilla_id)
SELECT 'Integrante ' || replace(q.nombre, 'Cuadrilla ', '') || ' ' || g, q.id
FROM cuadrillas q
CROSS JOIN LATERAL generate_series(2, CASE q.nombre WHEN 'Cuadrilla Esmeralda' THEN 4
                                                    WHEN 'Cuadrilla Follaje'   THEN 3
                                                    ELSE 5 END) AS g;

-- ---------------------------------------------------------------------
-- Cotizaciones: se registran como pendientes y luego se calculan con el procedimiento
-- ---------------------------------------------------------------------
INSERT INTO cotizaciones (cliente_id, zona_id, area_m2, tipo_vegetacion_id, frecuencia_id, num_operarios,
                          observaciones, creada_por, solicitada_en)
SELECT c.id, z.id, v.area, (SELECT id FROM tipos_vegetacion WHERE nombre = v.veg),
       (SELECT id FROM frecuencias WHERE nombre = v.frec), v.ops, v.obs,
       (SELECT id FROM usuarios WHERE correo = v.creador), v.fecha::timestamptz
FROM (VALUES
  -- cliente, zona, área, vegetación, frecuencia, operarios, observaciones, creador, fecha
  ('Unidad Residencial Portal del Bosque',  'Parque interno',             1600, 'Zona arborizada',   'Mensual',   4, NULL,                       'admin@dpm.example',         '2026-10-15 09:00-05'),
  ('Centro Comercial Plaza Mirador',        'Zonas verdes perimetrales',  3200, 'Mixta',             'Semanal',   6, NULL,                       'admin@dpm.example',         '2026-10-14 10:30-05'),
  ('Conjunto Residencial Los Almendros',    'Jardines de ingreso',         220, 'Jardín ornamental', 'Quincenal', 3, 'Incluir poda de setos.',   'almendros@cliente.example', '2026-10-05 08:15-05'),
  ('Colegio Nuevo Horizonte',               'Canchas y zonas verdes',     1900, 'Césped simple',     'Única vez', 5, NULL,                       'admin@dpm.example',         '2026-09-28 14:00-05'),
  ('Conjunto Residencial Los Almendros',    'Zona común - Torre A',        850, 'Césped simple',     'Mensual',   3, NULL,                       'almendros@cliente.example', '2026-09-02 09:30-05'),
  ('Unidad Residencial Portal del Bosque',  'Parque interno',             1600, 'Zona arborizada',   'Mensual',   4, NULL,                       'admin@dpm.example',         '2026-08-18 11:00-05')
) AS v(cliente, zona, area, veg, frec, ops, obs, creador, fecha)
JOIN clientes c ON c.nombre = v.cliente
JOIN zonas z    ON z.cliente_id = c.id AND z.nombre = v.zona;

-- Cálculo y envío (quedan 2 pendientes: Portal del Bosque 15-oct y Plaza Mirador 14-oct)
DO $$
DECLARE
    guada int := (SELECT id FROM equipos WHERE nombre = 'Guadañadora');
    moto  int := (SELECT id FROM equipos WHERE nombre = 'Motosierra');
    fumi  int := (SELECT id FROM equipos WHERE nombre = 'Fumigadora');
    q     int;
BEGIN
    -- Los Almendros, jardines de ingreso (05-oct): enviada
    SELECT id INTO q FROM cotizaciones WHERE solicitada_en = '2026-10-05 08:15-05';
    CALL sp_calcular_y_enviar_cotizacion(q, ARRAY[fumi]);

    -- Colegio (28-sep): rechazada
    SELECT id INTO q FROM cotizaciones WHERE solicitada_en = '2026-09-28 14:00-05';
    CALL sp_calcular_y_enviar_cotizacion(q, ARRAY[guada, fumi]);
    UPDATE cotizaciones SET estado = 'rechazada' WHERE id = q;

    -- Los Almendros, Torre A (02-sep): aceptada
    SELECT id INTO q FROM cotizaciones WHERE solicitada_en = '2026-09-02 09:30-05';
    CALL sp_calcular_y_enviar_cotizacion(q, ARRAY[guada]);
    UPDATE cotizaciones SET estado = 'aceptada' WHERE id = q;

    -- Portal del Bosque, parque interno (18-ago): aceptada
    SELECT id INTO q FROM cotizaciones WHERE solicitada_en = '2026-08-18 11:00-05';
    CALL sp_calcular_y_enviar_cotizacion(q, ARRAY[guada, moto, fumi]);
    UPDATE cotizaciones SET estado = 'aceptada' WHERE id = q;
END $$;

-- Las fechas de envío calculadas con now() se ajustan a un día después de la solicitud (datos históricos)
UPDATE cotizaciones SET enviada_en = solicitada_en + interval '1 day' WHERE enviada_en IS NOT NULL;

-- ---------------------------------------------------------------------
-- Órdenes de trabajo
-- ---------------------------------------------------------------------
INSERT INTO ordenes_trabajo (cotizacion_id, zona_id, tipo_servicio, cuadrilla_id, inicio, fin, estado,
                             iniciada_en, finalizada_en, finalizada_por, nota_finalizacion)
SELECT cot.id, z.id, v.servicio, q.id, v.inicio::timestamptz, v.fin::timestamptz, v.estado::estado_orden,
       v.iniciada::timestamptz, v.finalizada::timestamptz, op.id, v.nota
FROM (VALUES
  -- zona, servicio, cuadrilla, inicio, fin, estado, iniciada, finalizada, finalizó, nota, cotización(fecha solicitud)
  ('Zona común - Torre A',        'Corte de césped y perfilado',     'Cuadrilla Esmeralda', '2026-10-10 08:00-05', '2026-10-10 11:00-05', 'finalizada',
        '2026-10-10 08:05-05', '2026-10-10 10:50-05', 'Luis Fernando Gómez',  'Servicio completado sin novedades.', '2026-09-02 09:30-05'),
  ('Parque interno',              'Poda de árboles y recolección',   'Cuadrilla Raíces',    '2026-10-08 08:00-05', '2026-10-08 12:00-05', 'finalizada',
        '2026-10-08 08:10-05', '2026-10-08 11:40-05', 'Camilo Andrés Torres', 'Se retiró el material de poda.',       '2026-08-18 11:00-05'),
  ('Canchas y zonas verdes',      'Corte previo a evento institucional', 'Cuadrilla Esmeralda', '2026-09-30 07:00-05', '2026-09-30 12:00-05', 'finalizada',
        '2026-09-30 07:05-05', '2026-09-30 11:30-05', 'Luis Fernando Gómez',  'Servicio completado sin novedades.', NULL),
  ('Parque interno',              'Control fitosanitario',           'Cuadrilla Follaje',   '2026-10-14 08:00-05', '2026-10-14 10:00-05', 'finalizada',
        '2026-10-14 08:05-05', '2026-10-14 09:55-05', 'Sandra Milena Rojas',  'Incidencia: plaga en un sector; se recomienda un segundo control.', NULL),
  ('Zonas verdes perimetrales',   'Mantenimiento integral semanal',  'Cuadrilla Esmeralda', '2026-10-17 08:00-05', '2026-10-17 14:00-05', 'en_ejecucion',
        '2026-10-17 08:10-05', NULL, NULL, NULL, NULL),
  ('Jardines de ingreso',         'Poda ornamental y fumigación',    'Cuadrilla Follaje',   '2026-10-20 09:00-05', '2026-10-20 11:30-05', 'pendiente',
        NULL, NULL, NULL, NULL, '2026-10-05 08:15-05'),
  ('Zonas verdes perimetrales',   'Mantenimiento integral semanal',  'Cuadrilla Raíces',    '2026-10-21 08:00-05', '2026-10-21 14:00-05', 'pendiente',
        NULL, NULL, NULL, NULL, NULL),
  ('Zona común - Torre A',        'Corte de césped y perfilado',     'Cuadrilla Esmeralda', '2026-10-24 08:00-05', '2026-10-24 11:00-05', 'pendiente',
        NULL, NULL, NULL, NULL, '2026-09-02 09:30-05'),
  ('Canchas y zonas verdes',      'Corte de césped y perfilado',     NULL,                  '2026-10-27 08:00-05', '2026-10-27 12:00-05', 'pendiente',
        NULL, NULL, NULL, NULL, NULL)
) AS v(zona, servicio, cuadrilla, inicio, fin, estado, iniciada, finalizada, finalizo, nota, cot_fecha)
JOIN zonas z             ON z.nombre = v.zona
LEFT JOIN cuadrillas q   ON q.nombre = v.cuadrilla
LEFT JOIN operarios op   ON op.nombre = v.finalizo
LEFT JOIN cotizaciones cot ON cot.solicitada_en = v.cot_fecha::timestamptz;