-- HU-08: amplÃ­a el reporte sin eliminar datos ni recrear el esquema.
-- Ejecutar una sola vez en bases que ya tengan 01_schema.sql.
-- Requiere una cuenta propietaria del esquema (o rol de migraciones), no dpm_api.
-- dpm_api solo consume la funciÃ³n mediante los permisos otorgados al final.
BEGIN;

DROP FUNCTION IF EXISTS dpm.fn_reporte_periodo(date, date, integer);

CREATE FUNCTION dpm.fn_reporte_periodo(p_desde date, p_hasta date, p_cliente_id integer DEFAULT NULL)
RETURNS TABLE (cliente varchar, cotizaciones_solicitadas bigint, cotizaciones_aceptadas bigint,
               valor_aceptado numeric, servicios_finalizados bigint, horas_registradas numeric,
               planillas_conciliadas bigint, diferencias_planillas bigint)
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
             WHERE p.cliente_id = c.id AND p.origen = 'campo' AND r.fecha BETWEEN p_desde AND p_hasta),
           (SELECT count(*) / 2 FROM planillas_jornada p
             WHERE p.cliente_id = c.id AND p.estado = 'conciliada'
               AND p.periodo_desde >= p_desde AND p.periodo_hasta <= p_hasta),
           (SELECT count(*) / 2 FROM planillas_jornada p
             WHERE p.cliente_id = c.id AND p.estado = 'en_comparacion'
               AND p.periodo_desde >= p_desde AND p.periodo_hasta <= p_hasta)
    FROM clientes c
    WHERE p_cliente_id IS NULL OR c.id = p_cliente_id
    ORDER BY c.nombre;
$$;

REVOKE ALL ON FUNCTION dpm.fn_reporte_periodo(date, date, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION dpm.fn_reporte_periodo(date, date, integer) TO dpm_reportes, dpm_app;

COMMIT;

