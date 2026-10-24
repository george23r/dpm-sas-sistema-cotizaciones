-- =====================================================================
-- DPM SAS — Datos de prueba (versión 2)
-- Archivo: 02_seed.sql   (ejecutar DESPUÉS de 01_schema.sql)
--
-- IMPORTANTE:
--  * Todos los datos son FICTICIOS: clientes, personas y correos (dominio .example).
--    No se reproducen nombres, cédulas, NIT, valores ni logos de documentos reales de DPM SAS
--    ni de sus clientes. La estructura de las cotizaciones y de las planillas sí se basa en
--    los ejemplos entregados por la empresa.
--  * Los valores en pesos son ILUSTRATIVOS y las unidades de cobro por confirmar con DPM SAS.
--  * Los "password_hash" son marcadores de prueba, NO son hashes reales: la aplicación debe
--    almacenar hashes (por ejemplo, bcrypt) y nunca contraseñas en texto plano (RNF-02).
-- =====================================================================
SET search_path = dpm, public;
SET TIME ZONE 'America/Bogota';

-- ---------------------------------------------------------------------
-- Catálogo de servicios (los 7 servicios que ofrece DPM SAS según la entrevista)
-- ---------------------------------------------------------------------
INSERT INTO servicios (nombre, unidad_cobro) VALUES
  ('Poda de árboles',                       'árbol'),
  ('Resiembra con macollo',                 'm²'),
  ('Resiembra con semilla',                 'm²'),
  ('Control de limpieza manual',            'm²'),
  ('Rectificación de encalle manual',       'global'),
  ('Riego en situaciones de sequía',        'jornada'),
  ('Fumigación manual',                     'jornada');

-- ---------------------------------------------------------------------
-- Usuarios, clientes y zonas
-- ---------------------------------------------------------------------
INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES
  ('Administrador DPM',     'admin@dpm.example',          'HASH_DE_PRUEBA_NO_USAR', 'administrador'),
  ('Cliente Hacienda',      'hacienda@cliente.example',   'HASH_DE_PRUEBA_NO_USAR', 'cliente'),
  ('Luis Fernando Gómez',   'luis.gomez@dpm.example',     'HASH_DE_PRUEBA_NO_USAR', 'operario'),
  ('Sandra Milena Rojas',   'sandra.rojas@dpm.example',   'HASH_DE_PRUEBA_NO_USAR', 'operario'),
  ('Camilo Andrés Torres',  'camilo.torres@dpm.example',  'HASH_DE_PRUEBA_NO_USAR', 'operario');

INSERT INTO clientes (usuario_id, nombre, tipo, telefono, correo_contacto) VALUES
  ((SELECT id FROM usuarios WHERE correo = 'hacienda@cliente.example'),
        'Hacienda Ejemplo',             'agricola',      '3000000001', 'hacienda@cliente.example'),
  (NULL, 'Conjunto Residencial Ejemplo', 'residencial',   '3000000002', NULL),
  (NULL, 'Empresa Ejemplo S.A.S.',       'comercial',     '3000000003', NULL),
  (NULL, 'Colegio Ejemplo',              'institucional', '3000000004', NULL);

INSERT INTO zonas (cliente_id, nombre, direccion, area_m2, descripcion)
SELECT c.id, v.nombre, v.direccion, v.area, v.descr
FROM (VALUES
  ('Hacienda Ejemplo',             'Lote 002',  'Vía principal, km 3',  NULL,  'Lote de riego'),
  ('Hacienda Ejemplo',             'Lote 003',  'Vía principal, km 3',  NULL,  'Lote de resiembra'),
  ('Hacienda Ejemplo',             'Lote 005',  'Vía principal, km 4',  NULL,  'Lote de resiembra'),
  ('Hacienda Ejemplo',             'Lote 005A', 'Vía principal, km 4',  NULL,  'Lote de riego'),
  ('Hacienda Ejemplo',             'Lote 005B', 'Vía principal, km 4',  NULL,  'Lote de riego'),
  ('Hacienda Ejemplo',             'Lote 006A', 'Vía principal, km 5',  NULL,  'Lote de riego'),
  ('Hacienda Ejemplo',             'Lote 007',  'Vía principal, km 5',  NULL,  'Lote de riego'),
  ('Conjunto Residencial Ejemplo', 'Zona común - Torre A', 'Calle 45 # 12-30, Cali', 850,  NULL),
  ('Conjunto Residencial Ejemplo', 'Jardines de ingreso',  'Calle 45 # 12-30, Cali', 220,  NULL),
  ('Empresa Ejemplo S.A.S.',       'Árboles zona norte',       'Avenida 5N # 20-10, Cali', NULL, 'Diez árboles a intervenir'),
  ('Empresa Ejemplo S.A.S.',       'Zonas verdes perimetrales','Avenida 5N # 20-10, Cali', 3200, NULL),
  ('Colegio Ejemplo',              'Canchas y zonas verdes',   'Calle 9 # 40-15, Cali',    1900, NULL)
) AS v(cliente, nombre, direccion, area, descr)
JOIN clientes c ON c.nombre = v.cliente;

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
-- Cotizaciones (flujo: solicitada -> borrador -> enviada -> aceptada | rechazada)
-- ---------------------------------------------------------------------
INSERT INTO cotizaciones (cliente_id, zona_id, objeto, alcance, incluye, tiempo_ejecucion, observaciones, creada_por, solicitada_en)
SELECT c.id, z.id, v.objeto, v.alcance, v.incluye, v.tiempo, v.obs,
       (SELECT id FROM usuarios WHERE correo = v.creador), v.fecha::timestamptz
FROM (VALUES
  ('Empresa Ejemplo S.A.S.',       'Árboles zona norte',
   'Intervención técnica y mantenimiento fitosanitario de diez árboles',
   'Limpieza integral, mochada técnica de troncos secos, aplicación de cicatrizante, retiro de musgos y maleza y disposición de residuos vegetales.',
   'Personal, herramientas, insumos técnicos, transporte, disposición de residuos y elementos de seguridad.',
   'Se coordina con el cliente según las condiciones del lugar.', 'No incluye actividades adicionales no contempladas en el alcance.',
   'admin@dpm.example', '2026-10-12 09:00-05'),
  ('Hacienda Ejemplo',             'Lote 007',
   'Riego nocturno con motobomba en lotes de la hacienda',
   'Riego en turnos nocturnos de 12 horas con motobombero.', 'Personal, motobomba y combustible.',
   'Por jornadas, según el calendario de riego del cliente.', NULL,
   'hacienda@cliente.example', '2026-09-20 08:00-05'),
  ('Hacienda Ejemplo',             'Lote 005',
   'Resiembra con semilla en lote de la hacienda',
   'Corte de semilla, preparación de cajas y resiembra con semilla.', 'Personal y herramientas.',
   'Dos jornadas de 8 horas.', NULL,
   'admin@dpm.example', '2026-10-10 10:00-05'),
  ('Conjunto Residencial Ejemplo', 'Zona común - Torre A',
   'Corte de césped y perfilado de la zona común', NULL, NULL, NULL, 'Solicitud pendiente de visita técnica.',
   'admin@dpm.example', '2026-10-20 15:30-05'),
  ('Colegio Ejemplo',              'Canchas y zonas verdes',
   'Fumigación manual de canchas y zonas verdes', 'Fumigación manual de 1.900 m².', 'Personal y fumigadora.',
   'Una jornada.', NULL,
   'admin@dpm.example', '2026-09-28 14:00-05'),
  ('Empresa Ejemplo S.A.S.',       'Zonas verdes perimetrales',
   'Mantenimiento mensual de zonas verdes perimetrales', 'Control de limpieza manual y poda de mantenimiento.',
   'Personal, herramientas y transporte.', 'Visitas semanales durante un mes.', NULL,
   'admin@dpm.example', '2026-09-02 09:30-05')
) AS v(cliente, zona, objeto, alcance, incluye, tiempo, obs, creador, fecha)
JOIN clientes c ON c.nombre = v.cliente
JOIN zonas z    ON z.cliente_id = c.id AND z.nombre = v.zona
ORDER BY v.fecha::timestamptz;

-- Visitas técnicas (todas menos la solicitud más reciente, que aún espera visita)
INSERT INTO visitas_tecnicas (cotizacion_id, fecha, realizada_por, observaciones)
SELECT q.id, (q.solicitada_en + interval '2 days')::date, (SELECT id FROM usuarios WHERE correo = 'admin@dpm.example'),
       'Visita técnica para determinar necesidades y costos.'
FROM cotizaciones q WHERE q.objeto NOT LIKE 'Corte de césped y perfilado%';

-- Líneas de valor (lo que ve el cliente)
INSERT INTO cotizacion_lineas (cotizacion_id, servicio_id, concepto, cantidad, valor_unitario)
SELECT q.id, (SELECT id FROM servicios WHERE nombre = v.servicio), v.concepto, v.cant, v.valor
FROM (VALUES
  ('Intervención técnica y mantenimiento fitosanitario de diez árboles', 'Poda de árboles',
   'Intervención técnica y mantenimiento fitosanitario de árboles', 10, 650000),
  ('Riego nocturno con motobomba en lotes de la hacienda', 'Riego en situaciones de sequía',
   'Jornada de riego nocturno con motobombero (12 horas)', 30, 140000),
  ('Resiembra con semilla en lote de la hacienda', 'Resiembra con semilla',
   'Resiembra con semilla (jornada de 8 horas por trabajador)', 14, 95000),
  ('Fumigación manual de canchas y zonas verdes', 'Fumigación manual',
   'Jornada de fumigación manual', 1, 480000),
  ('Mantenimiento mensual de zonas verdes perimetrales', 'Control de limpieza manual',
   'Mantenimiento mensual (cuatro visitas semanales)', 4, 520000)
) AS v(objeto, servicio, concepto, cant, valor)
JOIN cotizaciones q ON q.objeto = v.objeto;

-- Análisis interno de costos (no visible para el cliente)
INSERT INTO cotizacion_costos (cotizacion_id, tipo, descripcion, cantidad, valor_unitario)
SELECT q.id, v.tipo::tipo_costo, v.descr, v.cant, v.valor
FROM (VALUES
  ('Intervención técnica y mantenimiento fitosanitario de diez árboles', 'mano_obra',    'Cuatro trabajadores durante 6 días',  24, 90000),
  ('Intervención técnica y mantenimiento fitosanitario de diez árboles', 'herramientas', 'Herramientas e insumos (cicatrizante)', 1, 450000),
  ('Intervención técnica y mantenimiento fitosanitario de diez árboles', 'transporte',   'Transporte de personal y equipos',    6, 60000),
  ('Riego nocturno con motobomba en lotes de la hacienda', 'mano_obra',    'Motobombero (jornada nocturna)',  30, 85000),
  ('Riego nocturno con motobomba en lotes de la hacienda', 'combustible',  'Combustible de la motobomba',     30, 25000)
) AS v(objeto, tipo, descr, cant, valor)
JOIN cotizaciones q ON q.objeto = v.objeto;

-- Forma de pago por hitos (30 / 30 / 40) en todas las cotizaciones con líneas
INSERT INTO cotizacion_hitos (cotizacion_id, orden, descripcion, porcentaje)
SELECT q.id, h.orden, h.descr, h.pct
FROM cotizaciones q
CROSS JOIN (VALUES (1, 'Anticipo al iniciar el servicio', 30.00),
                   (2, 'Pago por avance del servicio',     30.00),
                   (3, 'Saldo al finalizar el servicio',   40.00)) AS h(orden, descr, pct)
WHERE EXISTS (SELECT 1 FROM cotizacion_lineas l WHERE l.cotizacion_id = q.id);

-- Estados: borrador (resiembra), enviada (árboles), aceptadas (riego y mantenimiento), rechazada (fumigación)
UPDATE cotizaciones SET estado = 'borrador' WHERE objeto LIKE 'Resiembra con semilla%';

DO $$
DECLARE q int; riego int; mensual int; fumi int;
BEGIN
    FOR q IN SELECT id FROM cotizaciones
              WHERE objeto LIKE 'Intervención técnica%' OR objeto LIKE 'Riego nocturno%'
                 OR objeto LIKE 'Fumigación manual%'    OR objeto LIKE 'Mantenimiento mensual%' ORDER BY id LOOP
        CALL sp_enviar_cotizacion(q);
    END LOOP;
    SELECT id INTO riego   FROM cotizaciones WHERE objeto LIKE 'Riego nocturno%';
    SELECT id INTO mensual FROM cotizaciones WHERE objeto LIKE 'Mantenimiento mensual%';
    SELECT id INTO fumi    FROM cotizaciones WHERE objeto LIKE 'Fumigación manual%';
    CALL sp_responder_cotizacion(riego, true);
    CALL sp_responder_cotizacion(mensual, true);
    CALL sp_responder_cotizacion(fumi, false);
END $$;

-- Fechas históricas (el envío ocurre un día después de la solicitud)
UPDATE cotizaciones SET enviada_en = solicitada_en + interval '3 days' WHERE enviada_en IS NOT NULL;

-- ---------------------------------------------------------------------
-- Órdenes de trabajo
-- ---------------------------------------------------------------------
INSERT INTO ordenes_trabajo (cotizacion_id, zona_id, tipo_servicio, cuadrilla_id, inicio, fin, estado,
                             iniciada_en, finalizada_en, finalizada_por, nota_finalizacion)
SELECT cot.id, z.id, v.servicio, q.id, v.inicio::timestamptz, v.fin::timestamptz, v.estado::estado_orden,
       v.iniciada::timestamptz, v.finalizada::timestamptz, op.id, v.nota
FROM (VALUES
  ('Lote 007',  'Riego nocturno con motobomba', 'Cuadrilla Follaje',   '2026-09-28 18:00-05', '2026-09-29 06:00-05', 'finalizada',
        '2026-09-28 18:05-05', '2026-09-29 05:55-05', 'Sandra Milena Rojas',  'Servicio completado sin novedades.', 'Riego nocturno%'),
  ('Lote 007',  'Riego nocturno con motobomba', 'Cuadrilla Follaje',   '2026-09-29 18:00-05', '2026-09-30 06:00-05', 'finalizada',
        '2026-09-29 18:05-05', '2026-09-30 05:55-05', 'Sandra Milena Rojas',  'Servicio completado sin novedades.', 'Riego nocturno%'),
  ('Lote 005',  'Resiembra con semilla',        'Cuadrilla Raíces',    '2026-10-06 06:00-05', '2026-10-06 14:00-05', 'finalizada',
        '2026-10-06 06:05-05', '2026-10-06 13:50-05', 'Camilo Andrés Torres', 'Se retiró el material sobrante.', NULL),
  ('Zonas verdes perimetrales', 'Mantenimiento mensual', 'Cuadrilla Esmeralda', '2026-10-10 08:00-05', '2026-10-10 11:00-05', 'finalizada',
        '2026-10-10 08:05-05', '2026-10-10 10:50-05', 'Luis Fernando Gómez',  'Servicio completado sin novedades.', 'Mantenimiento mensual%'),
  ('Zonas verdes perimetrales', 'Mantenimiento mensual', 'Cuadrilla Esmeralda', '2026-10-17 08:00-05', '2026-10-17 14:00-05', 'en_ejecucion',
        '2026-10-17 08:10-05', NULL, NULL, NULL, 'Mantenimiento mensual%'),
  ('Zonas verdes perimetrales', 'Mantenimiento mensual', 'Cuadrilla Raíces',    '2026-10-21 08:00-05', '2026-10-21 14:00-05', 'pendiente',
        NULL, NULL, NULL, NULL, 'Mantenimiento mensual%'),
  ('Zonas verdes perimetrales', 'Mantenimiento mensual', 'Cuadrilla Esmeralda', '2026-10-24 08:00-05', '2026-10-24 11:00-05', 'pendiente',
        NULL, NULL, NULL, NULL, 'Mantenimiento mensual%'),
  ('Canchas y zonas verdes',    'Fumigación manual',     NULL,                  '2026-10-27 08:00-05', '2026-10-27 12:00-05', 'pendiente',
        NULL, NULL, NULL, NULL, NULL)
) AS v(zona, servicio, cuadrilla, inicio, fin, estado, iniciada, finalizada, finalizo, nota, cot_objeto)
JOIN zonas z             ON z.nombre = v.zona
LEFT JOIN cuadrillas q   ON q.nombre = v.cuadrilla
LEFT JOIN operarios op   ON op.nombre = v.finalizo
LEFT JOIN cotizaciones cot ON cot.objeto LIKE v.cot_objeto;

-- ---------------------------------------------------------------------
-- Planillas de jornada (estructura tomada de las planillas de apuntamiento de labores de campo)
-- La planilla administrativa difiere en dos registros, para demostrar la comparación.
-- ---------------------------------------------------------------------
CREATE TEMP TABLE _jor (operario text, fecha date, lote text, actividad text, labor text, ini time, fin time, descanso numeric);
INSERT INTO _jor VALUES
  ('Integrante Follaje 2', '2026-09-28', 'Lote 007',  'RIEGO', 'MOTOBOMBERO', '18:00', '06:00', 0),
  ('Integrante Follaje 2', '2026-09-29', 'Lote 007',  'RIEGO', 'MOTOBOMBERO', '18:00', '06:00', 0),
  ('Integrante Follaje 2', '2026-09-30', 'Lote 007',  'RIEGO', 'MOTOBOMBERO', '18:00', '06:00', 0),
  ('Integrante Follaje 2', '2026-10-01', 'Lote 006A', 'RIEGO', 'MOTOBOMBERO', '18:00', '06:00', 0),
  ('Integrante Follaje 2', '2026-10-02', 'Lote 006A', 'RIEGO', 'MOTOBOMBERO', '18:00', '06:00', 0),
  ('Integrante Follaje 2', '2026-10-06', 'Lote 006A', 'RIEGO', 'MOTOBOMBERO', '18:00', '06:00', 0),
  ('Integrante Follaje 2', '2026-10-07', 'Lote 006A', 'RIEGO', 'MOTOBOMBERO', '06:36', '16:00', 1),
  ('Integrante Follaje 3', '2026-09-28', 'Lote 002',  'RIEGO', 'MOTOBOMBERO', '18:00', '06:00', 0),
  ('Integrante Follaje 3', '2026-09-29', 'Lote 005A', 'RIEGO', 'MOTOBOMBERO', '18:00', '06:00', 0),
  ('Integrante Follaje 3', '2026-09-30', 'Lote 005A', 'RIEGO', 'MOTOBOMBERO', '18:00', '06:00', 0),
  ('Integrante Follaje 3', '2026-10-01', 'Lote 005A', 'RIEGO', 'MOTOBOMBERO', '18:00', '06:00', 0),
  ('Integrante Follaje 3', '2026-10-02', 'Lote 005B', 'RIEGO', 'MOTOBOMBERO', '18:00', '06:00', 0),
  ('Integrante Raíces 2',  '2026-10-06', 'Lote 005',  'RESIEMBRA', 'CORTE DE SEMILLA',       '06:00', '14:00', 0),
  ('Integrante Raíces 3',  '2026-10-06', 'Lote 003',  'RESIEMBRA', 'CORTE DE SEMILLA',       '06:00', '14:00', 0),
  ('Integrante Raíces 4',  '2026-10-06', 'Lote 005',  'RESIEMBRA', 'CAJAS PARA RESIEMBRA',   '06:00', '14:00', 0),
  ('Integrante Raíces 5',  '2026-10-06', 'Lote 005',  'RESIEMBRA', 'CAJAS PARA RESIEMBRA',   '06:00', '14:00', 0),
  ('Integrante Raíces 3',  '2026-10-07', 'Lote 003',  'RESIEMBRA', 'CAJAS PARA RESIEMBRA',   '06:00', '14:00', 0),
  ('Integrante Raíces 4',  '2026-10-07', 'Lote 005',  'RESIEMBRA', 'RESIEMBRA CON SEMILLA',  '06:00', '14:00', 0),
  ('Integrante Raíces 5',  '2026-10-07', 'Lote 005',  'RESIEMBRA', 'RESIEMBRA CON SEMILLA',  '06:00', '14:00', 0);

INSERT INTO planillas_jornada (cliente_id, periodo_desde, periodo_hasta, origen, registrada_por)
SELECT (SELECT id FROM clientes WHERE nombre = 'Hacienda Ejemplo'), '2026-09-28', '2026-10-07', o::origen_planilla,
       (SELECT id FROM usuarios WHERE correo = 'admin@dpm.example')
FROM unnest(ARRAY['campo', 'administrativa']) AS o;

-- Planilla de campo: todos los registros
INSERT INTO registros_jornada (planilla_id, operario_id, fecha, zona_id, centro_costo, actividad, labor, hora_inicio, hora_fin, descanso_horas)
SELECT p.id, op.id, j.fecha, z.id, j.actividad, j.actividad, j.labor, j.ini, j.fin, j.descanso
FROM _jor j
JOIN planillas_jornada p ON p.origen = 'campo'
JOIN operarios op        ON op.nombre = j.operario
JOIN zonas z             ON z.nombre = j.lote AND z.cliente_id = p.cliente_id;

-- Planilla administrativa: igual, salvo un turno con 6 horas en lugar de 8 y un turno que falta
INSERT INTO registros_jornada (planilla_id, operario_id, fecha, zona_id, centro_costo, actividad, labor, hora_inicio, hora_fin, descanso_horas)
SELECT p.id, op.id, j.fecha, z.id, j.actividad, j.actividad, j.labor, j.ini,
       CASE WHEN j.operario = 'Integrante Raíces 4' AND j.fecha = '2026-10-07' THEN time '12:00' ELSE j.fin END,
       j.descanso
FROM _jor j
JOIN planillas_jornada p ON p.origen = 'administrativa'
JOIN operarios op        ON op.nombre = j.operario
JOIN zonas z             ON z.nombre = j.lote AND z.cliente_id = p.cliente_id
WHERE NOT (j.operario = 'Integrante Raíces 5' AND j.fecha = '2026-10-07');

UPDATE planillas_jornada SET estado = 'en_comparacion';
DROP TABLE _jor;