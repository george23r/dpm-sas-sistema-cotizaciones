-- =====================================================================
-- DPM SAS — Consultas y pruebas de comprobación de la base de datos (versión 2)
-- Archivo: 03_consultas_comprobacion.sql  (ejecutar DESPUÉS de 01 y 02)
--
-- Cada prueba imprime "PASS" o falla con una excepción, y se relaciona con la
-- historia de usuario (HU) o el requisito que verifica.
-- Las pruebas que crean datos los revierten al final (no alteran los datos de prueba).
-- =====================================================================
SET search_path = dpm, public;
SET TIME ZONE 'America/Bogota';
\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------
-- C1 (HU-01): el total de la cotización es la suma de sus líneas (cantidad × valor unitario)
--     COT "Intervención ... diez árboles": 10 × 650.000 = 6.500.000
-- ---------------------------------------------------------------------
DO $$
DECLARE t numeric;
BEGIN
    SELECT total INTO t FROM cotizaciones WHERE objeto LIKE 'Intervención técnica%';
    IF t <> 6500000 THEN RAISE EXCEPTION 'FAIL C1: total = %', t; END IF;
    RAISE NOTICE 'PASS C1   Total de la cotización = suma de líneas (HU-01): %', t;
END $$;

-- ---------------------------------------------------------------------
-- C2 (HU-01): la cotización pasa por el flujo borrador -> enviada y exige visita técnica,
--     líneas y hitos de pago que sumen 100 %
-- ---------------------------------------------------------------------
DO $$
DECLARE q int; admin_id int := (SELECT id FROM usuarios WHERE correo = 'admin@dpm.example');
BEGIN
    BEGIN
        INSERT INTO cotizaciones (cliente_id, zona_id, objeto, creada_por)
        SELECT c.id, z.id, 'Prueba de envío', admin_id FROM zonas z JOIN clientes c ON c.id = z.cliente_id
         WHERE z.nombre = 'Lote 002' RETURNING id INTO q;

        -- sin visita técnica
        BEGIN
            CALL sp_enviar_cotizacion(q);
            RAISE EXCEPTION 'FAIL C2a: se envió sin visita técnica';
        EXCEPTION WHEN raise_exception THEN
            IF SQLERRM NOT LIKE '%visita técnica%' THEN RAISE; END IF;
            RAISE NOTICE 'PASS C2a  No se envía una cotización sin visita técnica registrada';
        END;
        INSERT INTO visitas_tecnicas (cotizacion_id, fecha, realizada_por) VALUES (q, current_date, admin_id);

        -- sin líneas
        BEGIN
            CALL sp_enviar_cotizacion(q);
            RAISE EXCEPTION 'FAIL C2b: se envió sin líneas';
        EXCEPTION WHEN raise_exception THEN
            IF SQLERRM NOT LIKE '%no tiene líneas%' THEN RAISE; END IF;
            RAISE NOTICE 'PASS C2b  No se envía una cotización sin líneas de valor';
        END;
        INSERT INTO cotizacion_lineas (cotizacion_id, concepto, cantidad, valor_unitario) VALUES (q, 'Servicio de prueba', 2, 100000);

        -- hitos que no suman 100
        INSERT INTO cotizacion_hitos VALUES (q, 1, 'Anticipo', 30), (q, 2, 'Saldo', 50);
        BEGIN
            CALL sp_enviar_cotizacion(q);
            RAISE EXCEPTION 'FAIL C2c: se envió con hitos que no suman 100';
        EXCEPTION WHEN raise_exception THEN
            IF SQLERRM NOT LIKE '%sumar 100%' THEN RAISE; END IF;
            RAISE NOTICE 'PASS C2c  Los hitos de pago deben sumar 100 %%';
        END;
        UPDATE cotizacion_hitos SET porcentaje = 70 WHERE cotizacion_id = q AND orden = 2;

        CALL sp_enviar_cotizacion(q);
        IF (SELECT estado FROM cotizaciones WHERE id = q) <> 'enviada' THEN RAISE EXCEPTION 'FAIL C2d'; END IF;
        RAISE NOTICE 'PASS C2d  Cotización completa enviada correctamente';

        -- una vez enviada, el precio es fijo
        BEGIN
            UPDATE cotizacion_lineas SET valor_unitario = 1 WHERE cotizacion_id = q;
            RAISE EXCEPTION 'FAIL C2e: se modificó una cotización enviada';
        EXCEPTION WHEN check_violation THEN
            RAISE NOTICE 'PASS C2e  Una cotización enviada no puede modificarse (precio fijo)';
        END;
        RAISE EXCEPTION 'rollback_prueba';
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM <> 'rollback_prueba' THEN RAISE; END IF;
    END;
END $$;

-- ---------------------------------------------------------------------
-- C3 (vigencia): una cotización vencida (más de 15 días) no puede aceptarse
-- ---------------------------------------------------------------------
DO $$
DECLARE q int; admin_id int := (SELECT id FROM usuarios WHERE correo = 'admin@dpm.example');
BEGIN
    BEGIN
        INSERT INTO cotizaciones (cliente_id, zona_id, objeto, creada_por)
        SELECT c.id, z.id, 'Prueba de vigencia', admin_id FROM zonas z JOIN clientes c ON c.id = z.cliente_id
         WHERE z.nombre = 'Lote 002' RETURNING id INTO q;
        INSERT INTO visitas_tecnicas (cotizacion_id, fecha, realizada_por) VALUES (q, current_date, admin_id);
        INSERT INTO cotizacion_lineas (cotizacion_id, concepto, cantidad, valor_unitario) VALUES (q, 'Servicio', 1, 100000);
        INSERT INTO cotizacion_hitos VALUES (q, 1, 'Pago único', 100);
        CALL sp_enviar_cotizacion(q);
        UPDATE cotizaciones SET solicitada_en = now() - interval '30 days', enviada_en = now() - interval '20 days' WHERE id = q;
        BEGIN
            CALL sp_responder_cotizacion(q, true);
            RAISE EXCEPTION 'FAIL C3: se aceptó una cotización vencida';
        EXCEPTION WHEN raise_exception THEN
            IF SQLERRM NOT LIKE '%venció%' THEN RAISE; END IF;
            RAISE NOTICE 'PASS C3   Una cotización vencida no puede aceptarse (vigencia de 15 días)';
        END;
        RAISE EXCEPTION 'rollback_prueba';
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM <> 'rollback_prueba' THEN RAISE; END IF;
    END;
END $$;

-- ---------------------------------------------------------------------
-- C4 (HU-01): análisis interno de costos frente al precio ofrecido
-- ---------------------------------------------------------------------
DO $$
DECLARE c numeric; p numeric;
BEGIN
    SELECT costo_estimado, precio INTO c, p FROM v_cotizacion_costo_vs_precio WHERE precio = 6500000;
    -- costos: 24×90.000 + 1×450.000 + 6×60.000 = 2.970.000
    IF c <> 2970000 THEN RAISE EXCEPTION 'FAIL C4: costo estimado = %', c; END IF;
    RAISE NOTICE 'PASS C4   Costo estimado % frente a precio % (HU-01)', c, p;
END $$;

-- ---------------------------------------------------------------------
-- C5 (HU-03): el sistema rechaza una programación que cruce horarios de una cuadrilla
-- ---------------------------------------------------------------------
DO $$
BEGIN
    BEGIN
        INSERT INTO ordenes_trabajo (zona_id, tipo_servicio, cuadrilla_id, inicio, fin)
        VALUES ((SELECT id FROM zonas WHERE nombre = 'Zonas verdes perimetrales'), 'Prueba de cruce',
                (SELECT id FROM cuadrillas WHERE nombre = 'Cuadrilla Esmeralda'),
                '2026-10-17 10:00-05', '2026-10-17 12:00-05');
        RAISE EXCEPTION 'FAIL C5: se permitió un cruce de horario';
    EXCEPTION WHEN exclusion_violation THEN
        RAISE NOTICE 'PASS C5   Cruce de horario rechazado (HU-03): %', SQLERRM;
    END;
END $$;

-- C6 (HU-03): servicios consecutivos sí se permiten
DO $$
BEGIN
    BEGIN
        INSERT INTO ordenes_trabajo (zona_id, tipo_servicio, cuadrilla_id, inicio, fin)
        VALUES ((SELECT id FROM zonas WHERE nombre = 'Zonas verdes perimetrales'), 'Prueba consecutiva',
                (SELECT id FROM cuadrillas WHERE nombre = 'Cuadrilla Esmeralda'),
                '2026-10-17 14:00-05', '2026-10-17 16:00-05');
        RAISE NOTICE 'PASS C6   Servicios consecutivos permitidos (HU-03)';
        RAISE EXCEPTION 'rollback_prueba';
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM <> 'rollback_prueba' THEN RAISE; END IF;
    END;
END $$;

-- C7 (HU-03): una orden solo puede originarse en una cotización aceptada
DO $$
BEGIN
    BEGIN
        INSERT INTO ordenes_trabajo (cotizacion_id, zona_id, tipo_servicio, inicio, fin)
        VALUES ((SELECT id FROM cotizaciones WHERE estado = 'enviada' LIMIT 1),
                (SELECT id FROM zonas WHERE nombre = 'Árboles zona norte'), 'Prueba', '2026-11-02 08:00-05', '2026-11-02 12:00-05');
        RAISE EXCEPTION 'FAIL C7: orden creada desde una cotización no aceptada';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS C7   Una orden solo se crea desde una cotización aceptada';
    END;
END $$;

-- C8 (HU-04): una orden en ejecución o finalizada exige cuadrilla asignada
DO $$
BEGIN
    BEGIN
        UPDATE ordenes_trabajo SET estado = 'en_ejecucion', iniciada_en = now() WHERE cuadrilla_id IS NULL;
        RAISE EXCEPTION 'FAIL C8: se inició una orden sin cuadrilla';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS C8   No se puede iniciar una orden sin cuadrilla asignada (HU-04)';
    END;
END $$;

-- C9 (HU-06): al finalizar se registra responsable, y debe ser de la cuadrilla
DO $$
BEGIN
    BEGIN
        UPDATE ordenes_trabajo SET estado = 'finalizada', finalizada_en = now() WHERE estado = 'en_ejecucion';
        RAISE EXCEPTION 'FAIL C9a: se finalizó sin responsable';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS C9a  Finalizar sin responsable es rechazado (HU-06)';
    END;
    BEGIN
        UPDATE ordenes_trabajo
           SET estado = 'finalizada', finalizada_en = now(),
               finalizada_por = (SELECT id FROM operarios WHERE nombre = 'Sandra Milena Rojas')
         WHERE estado = 'en_ejecucion';
        RAISE EXCEPTION 'FAIL C9b: finalizó un operario de otra cuadrilla';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'PASS C9b  Un operario de otra cuadrilla no puede finalizar la orden (HU-06)';
    END;
END $$;

-- C10 (HU-05): el operario solo ve las órdenes de su cuadrilla (Luis Gómez, Cuadrilla Esmeralda: 3 órdenes)
DO $$
DECLARE n int; otras int;
BEGIN
    SELECT count(*) INTO n FROM v_ordenes_operario WHERE usuario_id = (SELECT id FROM usuarios WHERE correo = 'luis.gomez@dpm.example');
    SELECT count(*) INTO otras FROM v_ordenes_operario v JOIN ordenes_trabajo o ON o.id = v.orden_id
     WHERE v.usuario_id = (SELECT id FROM usuarios WHERE correo = 'luis.gomez@dpm.example')
       AND o.cuadrilla_id <> (SELECT id FROM cuadrillas WHERE nombre = 'Cuadrilla Esmeralda');
    IF n <> 3 OR otras <> 0 THEN RAISE EXCEPTION 'FAIL C10: ordenes=% ajenas=%', n, otras; END IF;
    RAISE NOTICE 'PASS C10  El operario ve únicamente las órdenes de su cuadrilla (HU-05): %', n;
END $$;

-- C11 (HU-07): historial de servicios finalizados por cliente
DO $$
DECLARE n int;
BEGIN
    SELECT count(*) INTO n FROM v_historial_servicios WHERE cliente = 'Hacienda Ejemplo';
    IF n <> 3 THEN RAISE EXCEPTION 'FAIL C11: servicios de la hacienda = %', n; END IF;
    RAISE NOTICE 'PASS C11  Historial del cliente consultable (HU-07): % servicios finalizados', n;
END $$;

-- ---------------------------------------------------------------------
-- C12 (HU-09): horas de una jornada nocturna (18:00 a 06:00 = 12 h) y con descanso (06:36 a 16:00 - 1 h = 8,4 h)
--     La planilla de campo del seed suma 196,4 horas (80,4 + 116)
-- ---------------------------------------------------------------------
DO $$
DECLARE total numeric; noche numeric; descanso numeric;
BEGIN
    SELECT sum(r.horas) INTO total FROM registros_jornada r JOIN planillas_jornada p ON p.id = r.planilla_id WHERE p.origen = 'campo';
    SELECT max(horas) INTO noche FROM registros_jornada WHERE hora_inicio = '18:00' AND hora_fin = '06:00';
    SELECT horas INTO descanso FROM registros_jornada WHERE hora_inicio = '06:36';
    IF total <> 196.4 OR noche <> 12 OR descanso <> 8.4 THEN
        RAISE EXCEPTION 'FAIL C12: total=% noche=% descanso=%', total, noche, descanso;
    END IF;
    RAISE NOTICE 'PASS C12  Cálculo de horas de jornada (HU-09): total % h, turno nocturno % h, con descanso % h', total, noche, descanso;
END $$;

-- ---------------------------------------------------------------------
-- C13 (HU-10): la comparación detecta diferencias (1 turno con distinto número de horas y 1 turno faltante)
-- ---------------------------------------------------------------------
DO $$
DECLARE dif int; solo_campo int; diferentes int; campo_id int; admin_id int;
BEGIN
    SELECT id INTO campo_id FROM planillas_jornada WHERE origen = 'campo';
    SELECT id INTO admin_id FROM planillas_jornada WHERE origen = 'administrativa';
    SELECT count(*) FILTER (WHERE resultado <> 'coincide'), count(*) FILTER (WHERE resultado = 'solo_campo'),
           count(*) FILTER (WHERE resultado = 'diferente')
      INTO dif, solo_campo, diferentes FROM fn_comparar_planillas(campo_id, admin_id);
    IF dif <> 2 OR solo_campo <> 1 OR diferentes <> 1 THEN
        RAISE EXCEPTION 'FAIL C13: diferencias=% solo_campo=% diferentes=%', dif, solo_campo, diferentes;
    END IF;
    RAISE NOTICE 'PASS C13  La comparación detecta las diferencias entre planillas (HU-10): %', dif;
END $$;

-- C14 (HU-10): no se concilia mientras haya diferencias; sí cuando coinciden; una planilla conciliada no se modifica
DO $$
DECLARE campo_id int; admin_id int;
BEGIN
    SELECT id INTO campo_id FROM planillas_jornada WHERE origen = 'campo';
    SELECT id INTO admin_id FROM planillas_jornada WHERE origen = 'administrativa';
    BEGIN
        CALL sp_conciliar_planillas(campo_id, admin_id);
        RAISE EXCEPTION 'FAIL C14a: se conciliaron planillas con diferencias';
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM NOT LIKE '%diferencias%' THEN RAISE; END IF;
        RAISE NOTICE 'PASS C14a No se concilian planillas con diferencias (HU-10)';
    END;
    BEGIN
        -- se corrige la planilla administrativa para que coincida con la de campo
        UPDATE registros_jornada SET hora_fin = '14:00'
         WHERE planilla_id = admin_id AND fecha = '2026-10-07' AND hora_inicio = '06:00' AND hora_fin = '12:00';
        INSERT INTO registros_jornada (planilla_id, operario_id, fecha, zona_id, centro_costo, actividad, labor, hora_inicio, hora_fin)
        SELECT admin_id, operario_id, fecha, zona_id, centro_costo, actividad, labor, hora_inicio, hora_fin
          FROM registros_jornada r WHERE planilla_id = campo_id
           AND NOT EXISTS (SELECT 1 FROM registros_jornada a WHERE a.planilla_id = admin_id AND a.operario_id = r.operario_id
                              AND a.fecha = r.fecha AND a.hora_inicio = r.hora_inicio);
        CALL sp_conciliar_planillas(campo_id, admin_id);
        RAISE NOTICE 'PASS C14b Planillas sin diferencias se concilian (HU-10)';
        BEGIN
            DELETE FROM registros_jornada WHERE planilla_id = campo_id;
            RAISE EXCEPTION 'FAIL C14c: se modificó una planilla conciliada';
        EXCEPTION WHEN check_violation THEN
            RAISE NOTICE 'PASS C14c Una planilla conciliada no puede modificarse';
        END;
        RAISE EXCEPTION 'rollback_prueba';
    EXCEPTION WHEN raise_exception THEN
        IF SQLERRM <> 'rollback_prueba' THEN RAISE; END IF;
    END;
END $$;

-- C15 (HU-08): reporte por periodo y cliente (incluye horas registradas)
DO $$
DECLARE solicitadas bigint; aceptadas bigint; valor numeric; horas numeric;
BEGIN
    SELECT cotizaciones_solicitadas, cotizaciones_aceptadas, valor_aceptado, horas_registradas
      INTO solicitadas, aceptadas, valor, horas
      FROM fn_reporte_periodo('2026-09-01', '2026-10-31', (SELECT id FROM clientes WHERE nombre = 'Hacienda Ejemplo'));
    IF solicitadas <> 2 OR aceptadas <> 1 OR valor <> 4200000 OR horas <> 196.4 THEN
        RAISE EXCEPTION 'FAIL C15: solicitadas=% aceptadas=% valor=% horas=%', solicitadas, aceptadas, valor, horas;
    END IF;
    RAISE NOTICE 'PASS C15  Reporte por periodo y cliente (HU-08): solicitadas=%, aceptadas=%, valor=%, horas=%', solicitadas, aceptadas, valor, horas;
END $$;

-- C16 (RNF-04): el perfil de reportes no puede leer usuarios ni costos internos
DO $$
BEGIN
    SET LOCAL ROLE dpm_reportes;
    PERFORM count(*) FROM dpm.v_historial_servicios;
    BEGIN
        PERFORM count(*) FROM dpm.usuarios;
        RESET ROLE;
        RAISE EXCEPTION 'FAIL C16a: dpm_reportes pudo leer usuarios';
    EXCEPTION WHEN insufficient_privilege THEN
        RESET ROLE;
        RAISE NOTICE 'PASS C16a El perfil de reportes no puede leer la tabla de usuarios (RNF-04)';
    END;
    SET LOCAL ROLE dpm_reportes;
    BEGIN
        PERFORM count(*) FROM dpm.cotizacion_costos;
        RESET ROLE;
        RAISE EXCEPTION 'FAIL C16b: dpm_reportes pudo leer los costos internos';
    EXCEPTION WHEN insufficient_privilege THEN
        RESET ROLE;
        RAISE NOTICE 'PASS C16b El perfil de reportes no puede leer el análisis interno de costos';
    END;
END $$;

-- C17 (integridad): la zona de una cotización debe pertenecer al cliente
DO $$
BEGIN
    BEGIN
        INSERT INTO cotizaciones (cliente_id, zona_id, objeto, creada_por)
        VALUES ((SELECT id FROM clientes WHERE nombre = 'Colegio Ejemplo'),
                (SELECT id FROM zonas WHERE nombre = 'Lote 002'), 'Prueba', (SELECT id FROM usuarios WHERE correo = 'admin@dpm.example'));
        RAISE EXCEPTION 'FAIL C17: se permitió una zona de otro cliente';
    EXCEPTION WHEN foreign_key_violation THEN
        RAISE NOTICE 'PASS C17  La zona debe pertenecer al cliente de la cotización';
    END;
END $$;

-- C18 (integridad): el usuario enlazado a un cliente debe tener rol cliente; una cuadrilla tiene un solo líder
DO $$
BEGIN
    BEGIN
        UPDATE clientes SET usuario_id = (SELECT id FROM usuarios WHERE correo = 'luis.gomez@dpm.example') WHERE nombre = 'Colegio Ejemplo';
        RAISE EXCEPTION 'FAIL C18a';
    EXCEPTION WHEN foreign_key_violation THEN
        RAISE NOTICE 'PASS C18a El usuario enlazado a un cliente debe tener rol cliente';
    END;
    BEGIN
        UPDATE operarios SET es_lider = true WHERE nombre = 'Integrante Esmeralda 2';
        RAISE EXCEPTION 'FAIL C18b';
    EXCEPTION WHEN unique_violation THEN
        RAISE NOTICE 'PASS C18b Una cuadrilla tiene un único líder';
    END;
END $$;

-- ---------------------------------------------------------------------
-- Consultas de ejemplo (resultados para el informe)
-- ---------------------------------------------------------------------
\echo '--- Cotizaciones (HU-01 / HU-02) ---'
SELECT consecutivo, cliente, estado, total, vence_el FROM v_cotizaciones_detalle ORDER BY cotizacion_id;

\echo '--- Comparación de planillas (HU-10) ---'
SELECT operario, fecha, horas_campo, horas_admin, resultado
FROM fn_comparar_planillas((SELECT id FROM planillas_jornada WHERE origen = 'campo'),
                           (SELECT id FROM planillas_jornada WHERE origen = 'administrativa'))
WHERE resultado <> 'coincide';

\echo '--- Reporte por periodo (HU-08) ---'
SELECT * FROM fn_reporte_periodo('2026-09-01', '2026-10-31');