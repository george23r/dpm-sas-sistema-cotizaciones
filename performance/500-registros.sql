-- Fixture opcional para rendimiento. Solo usar en una base local de pruebas.
-- No representa datos empresariales ni tarifas de DPM.
DO $$
DECLARE
    v_cliente integer;
    v_i integer;
BEGIN
    SELECT id INTO v_cliente FROM dpm.clientes ORDER BY id LIMIT 1;
    IF v_cliente IS NULL THEN
        RAISE EXCEPTION 'Se requiere al menos un cliente del seed de pruebas';
    END IF;

    FOR v_i IN 1..500 LOOP
        INSERT INTO dpm.zonas (cliente_id, nombre, direccion, area_m2, descripcion)
        VALUES (v_cliente, 'Rendimiento ' || lpad(v_i::text, 4, '0'), 'Dirección ficticia ' || v_i, 100 + v_i, 'Fixture de rendimiento')
        ON CONFLICT (cliente_id, nombre) DO NOTHING;
    END LOOP;
END $$;
