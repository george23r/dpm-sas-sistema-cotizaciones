import { z } from "zod";
import { pool } from "../../db/pool.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { asyncRoute, HttpError } from "../../shared/errors.js";

export const period = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => { const parsed = z.object({ desde: z.string().date(), hasta: z.string().date(), clienteId: z.coerce.number().int().positive().optional() }).safeParse(request.query); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "El periodo del reporte no es válido.", parsed.error.flatten().fieldErrors); const result = await pool.query(`SELECT * FROM dpm.fn_reporte_periodo($1,$2,$3)`, [parsed.data.desde, parsed.data.hasta, parsed.data.clienteId ?? null]); response.json({ data: result.rows }); })];
