import { z } from "zod";
import { pool } from "../../db/pool.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { asyncRoute, HttpError } from "../../shared/errors.js";

export const list = [authenticate, requireRole("administrador"), asyncRoute(async (_request, response) => { const result = await pool.query(`SELECT q.id, q.nombre, q.activa, count(o.id)::int AS integrantes, count(CASE WHEN o.activo THEN 1 END)::int AS integrantes_activos, count(ot.id) FILTER (WHERE ot.estado <> 'finalizada' AND ot.inicio >= now())::int AS servicios_proximos FROM dpm.cuadrillas q LEFT JOIN dpm.operarios o ON o.cuadrilla_id=q.id LEFT JOIN dpm.ordenes_trabajo ot ON ot.cuadrilla_id=q.id GROUP BY q.id ORDER BY q.nombre`); response.json({ data: result.rows }); })];
export const members = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => { const parsed = z.coerce.number().int().positive().safeParse(request.params.id); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "La cuadrilla no es válida."); const result = await pool.query(`SELECT id, nombre, usuario_id, cuadrilla_id, es_lider, activo FROM dpm.operarios WHERE cuadrilla_id=$1 ORDER BY es_lider DESC, nombre`, [parsed.data]); response.json({ data: result.rows }); })];
