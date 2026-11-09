-- Credenciales ficticias únicamente para E2E local/CI.
-- No usar este archivo para producción ni como política de contraseñas.
SET search_path = dpm, public;

UPDATE usuarios
SET password_hash = CASE correo
  WHEN 'admin@dpm.example' THEN '$2b$12$vKf2e94T/4WPQmNEg/F5D.ba3nXoV7HBE24i6xvXMRxaXLGyVKhaK'
  WHEN 'hacienda@cliente.example' THEN '$2b$12$u47fT/mK5RM./MXcFQMwJORg9vaLeBbWr5nyfog37J.V4KaaEnqCa'
  WHEN 'luis.gomez@dpm.example' THEN '$2b$12$fc1sttlAQFn.wf/lwCsbQuaPOAwZeP/8lNEifGH4gnoMVw.5tszBW'
  ELSE password_hash
END
WHERE correo IN ('admin@dpm.example', 'hacienda@cliente.example', 'luis.gomez@dpm.example');

-- Cotización aceptada disponible para validar el programador sin reutilizar una
-- cotización que ya tiene una orden histórica del seed general.
DO $$
DECLARE
  v_quote_id integer;
  v_cliente_id integer;
  v_zona_id integer;
  v_admin_id integer;
  v_servicio_id integer;
BEGIN
  SELECT c.id INTO v_cliente_id
  FROM dpm.clientes c
  JOIN dpm.usuarios u ON u.id = c.usuario_id
  WHERE u.correo = 'hacienda@cliente.example';
  SELECT id INTO v_zona_id FROM dpm.zonas WHERE cliente_id = v_cliente_id ORDER BY id LIMIT 1;
  SELECT id INTO v_admin_id FROM dpm.usuarios WHERE correo = 'admin@dpm.example';
  SELECT id INTO v_servicio_id FROM dpm.servicios ORDER BY id LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM dpm.cotizaciones WHERE objeto = 'E2E - mantenimiento disponible') THEN
    INSERT INTO dpm.cotizaciones (cliente_id, zona_id, objeto, alcance, creada_por, solicitada_en)
    VALUES (v_cliente_id, v_zona_id, 'E2E - mantenimiento disponible', 'Servicio ficticio para pruebas de programación.', v_admin_id, now())
    RETURNING id INTO v_quote_id;

    INSERT INTO dpm.visitas_tecnicas (cotizacion_id, fecha, realizada_por, observaciones)
    VALUES (v_quote_id, current_date, v_admin_id, 'Visita ficticia para pruebas E2E.');
    INSERT INTO dpm.cotizacion_lineas (cotizacion_id, servicio_id, concepto, cantidad, valor_unitario)
    VALUES (v_quote_id, v_servicio_id, 'Servicio ficticio E2E', 1, 1000);
    INSERT INTO dpm.cotizacion_hitos (cotizacion_id, orden, descripcion, porcentaje)
    VALUES (v_quote_id, 1, 'Pago único de prueba', 100);
    CALL dpm.sp_enviar_cotizacion(v_quote_id);
    CALL dpm.sp_responder_cotizacion(v_quote_id, true);
  END IF;
END $$;
