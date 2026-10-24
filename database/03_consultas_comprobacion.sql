-- =====================================================================
-- DPM SAS — Consultas y pruebas de comprobación de la base de datos
-- Archivo: 03_consultas_comprobacion.sql  (ejecutar DESPUÉS de 01 y 02)
--
-- Cada prueba imprime "PASS" o falla con una excepción.
-- Cada prueba se relaciona con la historia de usuario (HU) o el requisito que verifica.
-- =====================================================================
SET search_path = dpm, public;
SET TIME ZONE 'America/Bogota';
\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------
-- C1 (HU-01 / OE1): el precio se calcula con la fórmula de reglas de negocio
--     850 m² × $350 × 1,00 (césped) × 0,90 (mensual) = 267.750
--     + 3 operarios × $45.000 = 135.000 + guadañadora $20.000  →  total 422.750
-- ---------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
    SELECT * INTO r FROM fn_calcular_precio(
        850,
        (SELECT id FROM tipos_vegetacion WHERE nombre = 'Césped simple'),
        (SELECT id FROM frecuencias WHERE nombre = 'Mensual'),
        3,
        ARRAY[(SELECT id FROM equipos WHERE nombre = 'Guadañadora')::int]);
    IF r.subtotal_area <> 267750 OR r.costo_personal <> 135000 OR r.costo_equipos <> 20000 OR r.precio_total <> 422750 THEN
        RAISE EXCEPTION 'FAIL C1: precio calculado = %', r.precio_total;
    END IF;
    RAISE NOTICE 'PASS C1  Cálculo de precio (HU-01): total = %', r.precio_total;
END $$;

-- ---------------------------------------------------------------------
-- C2 (HU-01): la cotización guarda la "foto" de la tarifa y el total es consistente
-- ---------------------------------------------------------------------
DO $$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM cotizaciones
     WHERE estado <> 'pendiente'
       AND precio_total = subtotal_area + costo_personal + costo_equipos
       AND tarifa_base_aplicada IS NOT NULL;
    IF n <> 4 THEN RAISE EXCEPTION 'FAIL C2: cotizaciones calculadas consistentes = % (se esperaban 4)', n; END IF;
    RAISE NOTICE 'PASS C2  Cotizaciones calculadas con total consistente: %', n;
END $$;

-- ---------------------------------------------------------------------
-- C3 (HU-01): no se puede tener una cotización pendiente con precio, ni calculada sin precio
-- ---------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        UPDATE cotizaciones SET estado = 'enviada'
         WHERE estado = 'pendiente' AND solicitada_en = '2026-10-15 09:00-05';
        RAISE EXCEPTION 'FAIL C3: se permitió enviar una cotización sin precio';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS C3  Se rechaza una cotización "enviada" sin precio calculado';
    END;
END $$;

-- ---------------------------------------------------------------------
-- C4 (HU-03): el sistema rechaza una programación que cruce horarios de una cuadrilla
--     Cuadrilla Esmeralda ya tiene un servicio el 17-oct de 08:00 a 14:00
-- ---------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        INSERT INTO ordenes_trabajo (zona_id, tipo_servicio, cuadrilla_id, inicio, fin)
        VALUES ((SELECT id FROM zonas WHERE nombre = 'Zona común - Torre A'), 'Prueba de cruce',
                (SELECT id FROM cuadrillas WHERE nombre = 'Cuadrilla Esmeralda'),
                '2026-10-17 10:00-05', '2026-10-17 12:00-05');
        RAISE EXCEPTION 'FAIL C4: se permitió un cruce de horario';
    EXCEPTION WHEN exclusion_violation THEN
        RAISE NOTICE 'PASS C4  Cruce de horario rechazado (HU-03): %', SQLERRM;
    END;
END $$;

-- ---------------------------------------------------------------------
-- C5 (HU-03): servicios consecutivos (el fin de uno = el inicio del siguiente) SÍ se permiten
-- ---------------------------------------------------------------------
DO $$
DECLARE nuevo int;
BEGIN
    INSERT INTO ordenes_trabajo (zona_id, tipo_servicio, cuadrilla_id, inicio, fin)
    VALUES ((SELECT id FROM zonas WHERE nombre = 'Zona común - Torre A'), 'Prueba consecutiva',
            (SELECT id FROM cuadrillas WHERE nombre = 'Cuadrilla Esmeralda'),
            '2026-10-17 14:00-05', '2026-10-17 16:00-05')
    RETURNING id INTO nuevo;
    DELETE FROM ordenes_trabajo WHERE id = nuevo;      -- se limpia el dato de prueba
    RAISE NOTICE 'PASS C5  Servicios consecutivos permitidos (HU-03)';
END $$;

-- ---------------------------------------------------------------------
-- C6 (HU-04): una orden en ejecución o finalizada exige cuadrilla asignada
-- ---------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        UPDATE ordenes_trabajo SET estado = 'en_ejecucion', iniciada_en = now()
         WHERE cuadrilla_id IS NULL;
        RAISE EXCEPTION 'FAIL C6: se inició una orden sin cuadrilla';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS C6  No se puede iniciar una orden sin cuadrilla asignada (HU-04)';
    END;
END $$;

-- ---------------------------------------------------------------------
-- C7 (HU-06): al finalizar se registra fecha, hora y responsable; y el responsable debe ser de la cuadrilla
-- ---------------------------------------------------------------------
DO $$
BEGIN
    -- sin responsable
    BEGIN
        UPDATE ordenes_trabajo SET estado = 'finalizada', finalizada_en = now()
         WHERE estado = 'en_ejecucion';
        RAISE EXCEPTION 'FAIL C7a: se finalizó sin responsable';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS C7a Finalizar sin responsable es rechazado (HU-06)';
    END;
    -- responsable de otra cuadrilla (la orden en ejecución es de Esmeralda; se intenta con una operaria de Follaje)
    BEGIN
        UPDATE ordenes_trabajo
           SET estado = 'finalizada', finalizada_en = now(),
               finalizada_por = (SELECT id FROM operarios WHERE nombre = 'Sandra Milena Rojas')
         WHERE estado = 'en_ejecucion';
        RAISE EXCEPTION 'FAIL C7b: finalizó un operario de otra cuadrilla';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS C7b Un operario de otra cuadrilla no puede finalizar la orden (HU-06)';
    END;
END $$;

-- ---------------------------------------------------------------------
-- C8 (HU-05): el operario solo ve las órdenes de su cuadrilla
--     Luis Fernando Gómez (Cuadrilla Esmeralda) → 4 órdenes en los datos de prueba
-- ---------------------------------------------------------------------
DO $$
DECLARE n int; otras int;
BEGIN
    SELECT count(*) INTO n FROM v_ordenes_operario
     WHERE usuario_id = (SELECT id FROM usuarios WHERE correo = 'luis.gomez@dpm.example');
    SELECT count(*) INTO otras FROM v_ordenes_operario v
      JOIN ordenes_trabajo o ON o.id = v.orden_id
     WHERE v.usuario_id = (SELECT id FROM usuarios WHERE correo = 'luis.gomez@dpm.example')
       AND o.cuadrilla_id <> (SELECT id FROM cuadrillas WHERE nombre = 'Cuadrilla Esmeralda');
    IF n <> 4 OR otras <> 0 THEN RAISE EXCEPTION 'FAIL C8: ordenes=% ajenas=%', n, otras; END IF;
    RAISE NOTICE 'PASS C8  El operario ve únicamente las órdenes de su cuadrilla (HU-05): %', n;
END $$;

-- ---------------------------------------------------------------------
-- C9 (HU-07): historial de servicios por cliente, ordenado cronológicamente
-- ---------------------------------------------------------------------
DO $$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM v_historial_servicios
     WHERE cliente = 'Conjunto Residencial Los Almendros';
    IF n <> 1 THEN RAISE EXCEPTION 'FAIL C9: servicios finalizados de Los Almendros = %', n; END IF;
    RAISE NOTICE 'PASS C9  Historial del cliente consultable (HU-07): % servicio(s) finalizado(s)', n;
END $$;

-- ---------------------------------------------------------------------
-- C10 (HU-08): reporte por periodo con filtro por rango de fechas y por cliente
-- ---------------------------------------------------------------------
DO $$
DECLARE solicitadas bigint; aceptadas bigint; valor numeric;
BEGIN
    SELECT cotizaciones_solicitadas, cotizaciones_aceptadas, valor_aceptado
      INTO solicitadas, aceptadas, valor
      FROM fn_reporte_periodo('2026-08-01', '2026-10-31',
             (SELECT id FROM clientes WHERE nombre = 'Conjunto Residencial Los Almendros'));
    IF solicitadas <> 2 OR aceptadas <> 1 OR valor <> 422750 THEN
        RAISE EXCEPTION 'FAIL C10: solicitadas=% aceptadas=% valor=%', solicitadas, aceptadas, valor;
    END IF;
    RAISE NOTICE 'PASS C10 Reporte por periodo y cliente (HU-08): solicitadas=%, aceptadas=%, valor=%', solicitadas, aceptadas, valor;
END $$;

-- ---------------------------------------------------------------------
-- C11 (RNF-04): permisos por perfil de base de datos
--     dpm_reportes puede leer vistas, pero no la tabla de usuarios (contraseñas)
-- ---------------------------------------------------------------------
DO $$
BEGIN
    SET LOCAL ROLE dpm_reportes;
    PERFORM count(*) FROM dpm.v_historial_servicios;           -- permitido
    BEGIN
        PERFORM count(*) FROM dpm.usuarios;                    -- debe fallar
        RESET ROLE;
        RAISE EXCEPTION 'FAIL C11: dpm_reportes pudo leer usuarios';
    EXCEPTION WHEN insufficient_privilege THEN
        RESET ROLE;
        RAISE NOTICE 'PASS C11 El perfil de reportes no puede leer la tabla de usuarios (RNF-04)';
    END;
END $$;

-- ---------------------------------------------------------------------
-- C12 (integridad): una cotización no puede usar una zona de otro cliente
-- ---------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        INSERT INTO cotizaciones (cliente_id, zona_id, area_m2, tipo_vegetacion_id, frecuencia_id, num_operarios, creada_por)
        VALUES ((SELECT id FROM clientes WHERE nombre = 'Colegio Nuevo Horizonte'),
                (SELECT id FROM zonas WHERE nombre = 'Parque interno'),      -- zona de Portal del Bosque
                100, 1, 1, 1, (SELECT id FROM usuarios WHERE correo = 'admin@dpm.example'));
        RAISE EXCEPTION 'FAIL C12: se permitió una zona de otro cliente';
    EXCEPTION WHEN foreign_key_violation THEN
        RAISE NOTICE 'PASS C12 La zona debe pertenecer al cliente de la cotización';
    END;
END $$;

-- ---------------------------------------------------------------------
-- C13 (integridad): un usuario con rol "operario" no puede quedar asociado a un cliente
-- ---------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        UPDATE clientes SET usuario_id = (SELECT id FROM usuarios WHERE correo = 'luis.gomez@dpm.example')
         WHERE nombre = 'Colegio Nuevo Horizonte';
        RAISE EXCEPTION 'FAIL C13: se asoció un operario como cliente';
    EXCEPTION WHEN foreign_key_violation THEN
        RAISE NOTICE 'PASS C13 El usuario enlazado a un cliente debe tener rol cliente';
    END;
END $$;

-- ---------------------------------------------------------------------
-- C14 (integridad): una sola persona líder por cuadrilla
-- ---------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        UPDATE operarios SET es_lider = true WHERE nombre = 'Integrante Esmeralda 2';
        RAISE EXCEPTION 'FAIL C14: dos líderes en una cuadrilla';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'PASS C14 Una cuadrilla tiene un único líder';
    END;
END $$;

-- ---------------------------------------------------------------------
-- Consultas de ejemplo (resultados para el informe)
-- ---------------------------------------------------------------------
\echo '--- Cotizaciones (HU-01 / HU-02) ---'
SELECT cotizacion_id, cliente, zona, vegetacion, frecuencia, area_m2, num_operarios, estado, precio_total
FROM v_cotizaciones_detalle ORDER BY solicitada_en DESC;

\echo '--- Órdenes y cuadrillas (HU-03 / HU-04) ---'
SELECT orden_id, cliente, zona, tipo_servicio, inicio, estado, COALESCE(cuadrilla, '(por asignar)') AS cuadrilla
FROM v_ordenes_detalle ORDER BY inicio;

\echo '--- Reporte por periodo (HU-08) ---'
SELECT * FROM fn_reporte_periodo('2026-08-01', '2026-10-31');