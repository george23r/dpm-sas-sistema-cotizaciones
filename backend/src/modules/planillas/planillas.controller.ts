import { z } from "zod";
import { pool } from "../../db/pool.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { asyncRoute, HttpError } from "../../shared/errors.js";

const id = z.coerce.number().int().positive();
const sheetSchema = z.object({ clienteId: z.number().int().positive(), desde: z.string().date(), hasta: z.string().date(), origen: z.enum(["campo", "administrativa"]) });
const pairSchema = z.object({ clienteId: z.number().int().positive(), desde: z.string().date(), hasta: z.string().date() }).refine((value) => value.desde <= value.hasta, { message: "El inicio del periodo debe ser anterior o igual al final.", path: ["hasta"] });
const recordSchema = z.object({ operarioId: z.number().int().positive(), fecha: z.string().date(), zonaId: z.number().int().positive(), centroCosto: z.string().trim().max(60).optional(), actividad: z.string().trim().min(1).max(80), labor: z.string().trim().min(1).max(120), inicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/), fin: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/), descansoHoras: z.number().min(0).max(24).default(0), dominicalFestivo: z.boolean().default(false) });
function sheetId(request: { params: { id?: string } }) { const value = id.safeParse(request.params.id); if (!value.success) throw new HttpError(422, "VALIDATION_ERROR", "La planilla no es vÃ¡lida."); return value.data; }

export const list = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => { const clienteId = typeof request.query.clienteId === "string" ? Number(request.query.clienteId) : undefined; const params: unknown[] = []; const filter = clienteId ? `WHERE p.cliente_id=$${params.push(clienteId)}` : ""; const result = await pool.query(`SELECT p.id,p.cliente_id,c.nombre AS cliente,p.periodo_desde,p.periodo_hasta,p.origen,p.estado,p.registrada_por,p.creado_en FROM dpm.planillas_jornada p JOIN dpm.clientes c ON c.id=p.cliente_id ${filter} ORDER BY p.periodo_desde DESC,p.origen`, params); response.json({ data: result.rows }); })];

export const create = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => { if (!request.user) throw new HttpError(401, "UNAUTHENTICATED", "La sesiÃ³n es requerida."); const parsed = sheetSchema.safeParse(request.body); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Los datos de la planilla no son vÃ¡lidos.", parsed.error.flatten().fieldErrors); try { const result = await pool.query<{ id: number }>(`INSERT INTO dpm.planillas_jornada (cliente_id,periodo_desde,periodo_hasta,origen,registrada_por) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [parsed.data.clienteId, parsed.data.desde, parsed.data.hasta, parsed.data.origen, request.user.id]); const created = result.rows[0]; if (!created) throw new HttpError(500, "SHEET_CREATE_FAILED", "No fue posible crear la planilla."); response.status(201).json({ data: created }); } catch (error) { if (error instanceof Error && /duplicate|unique/i.test(error.message)) throw new HttpError(409, "SHEET_ALREADY_EXISTS", "Ya existe una planilla para este cliente, periodo y origen."); throw error; } })];

export const createPair = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => {
  if (!request.user) throw new HttpError(401, "UNAUTHENTICATED", "La sesiÃ³n es requerida.");
  const parsed = pairSchema.safeParse(request.body);
  if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "El periodo de las planillas no es vÃ¡lido.", parsed.error.flatten().fieldErrors);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{ id: number; origen: string }>(`INSERT INTO dpm.planillas_jornada (cliente_id,periodo_desde,periodo_hasta,origen,registrada_por) VALUES ($1,$2,$3,'campo',$4),($1,$2,$3,'administrativa',$4) RETURNING id,origen`, [parsed.data.clienteId, parsed.data.desde, parsed.data.hasta, request.user.id]);
    await client.query("COMMIT");
    response.status(201).json({ data: result.rows });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && /duplicate|unique/i.test(error.message)) throw new HttpError(409, "SHEET_PAIR_ALREADY_EXISTS", "Ya existe el par de planillas para este cliente y periodo.");
    throw error;
  } finally { client.release(); }
})];

export const addRecord = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => {
  const sheet = sheetId(request);
  const parsed = recordSchema.safeParse(request.body);
  if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Los datos del registro no son vÃ¡lidos.", parsed.error.flatten().fieldErrors);
  const context = await pool.query<{ cliente_id: number; periodo_desde: string; periodo_hasta: string; estado: string; zona_cliente_id: number | null; operario_activo: boolean | null }>(
    `SELECT p.cliente_id, p.periodo_desde, p.periodo_hasta, p.estado,
            z.cliente_id AS zona_cliente_id, o.activo AS operario_activo
       FROM dpm.planillas_jornada p
       LEFT JOIN dpm.zonas z ON z.id=$3
       LEFT JOIN dpm.operarios o ON o.id=$2
      WHERE p.id=$1`,
    [sheet, parsed.data.operarioId, parsed.data.zonaId],
  );
  const planilla = context.rows[0];
  if (!planilla) throw new HttpError(404, "SHEET_NOT_FOUND", "La planilla no existe.");
  if (planilla.estado === "conciliada") throw new HttpError(409, "SHEET_LOCKED", "La planilla ya fue conciliada y no puede modificarse.");
  if (parsed.data.fecha < planilla.periodo_desde || parsed.data.fecha > planilla.periodo_hasta) throw new HttpError(422, "DATE_OUTSIDE_PERIOD", "La fecha del turno debe estar dentro del periodo de la planilla.");
  if (planilla.zona_cliente_id !== planilla.cliente_id) throw new HttpError(422, "ZONE_CLIENT_MISMATCH", "La zona seleccionada no pertenece al cliente de la planilla.");
  if (planilla.operario_activo !== true) throw new HttpError(422, "WORKER_NOT_ACTIVE", "El trabajador seleccionado no estÃ¡ activo o no existe.");
  try {
    const result = await pool.query(`INSERT INTO dpm.registros_jornada (planilla_id,operario_id,fecha,zona_id,centro_costo,actividad,labor,hora_inicio,hora_fin,descanso_horas,dominical_festivo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,planilla_id,operario_id,fecha,zona_id,horas`, [sheet, parsed.data.operarioId, parsed.data.fecha, parsed.data.zonaId, parsed.data.centroCosto ?? null, parsed.data.actividad, parsed.data.labor, parsed.data.inicio, parsed.data.fin, parsed.data.descansoHoras, parsed.data.dominicalFestivo]);
    response.status(201).json({ data: result.rows[0] });
  } catch (error) {
    if (error instanceof Error && /duplicate|unique/i.test(error.message)) throw new HttpError(409, "SHIFT_ALREADY_EXISTS", "Ya existe un turno para ese trabajador, fecha y hora de inicio en esta planilla.");
    throw error;
  }
})];

export const compare = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => { const campo = id.safeParse(request.query.campoId); const admin = id.safeParse(request.query.adminId); if (!campo.success || !admin.success) throw new HttpError(422, "VALIDATION_ERROR", "Indica campoId y adminId."); const result = await pool.query(`SELECT operario,fecha,horas_campo,horas_admin,diferencia,resultado FROM dpm.fn_comparar_planillas($1,$2)`, [campo.data, admin.data]); response.json({ data: result.rows }); })];

export const reconcile = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => { const parsed = z.object({ campoId: z.number().int().positive(), adminId: z.number().int().positive() }).safeParse(request.body); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Indica las dos planillas a conciliar."); try { await pool.query("CALL dpm.sp_conciliar_planillas($1,$2)", [parsed.data.campoId, parsed.data.adminId]); response.json({ data: { estado: "conciliada", campoId: parsed.data.campoId, adminId: parsed.data.adminId } }); } catch (error) { if (error instanceof Error) throw new HttpError(409, "RECONCILIATION_BLOCKED", error.message); throw error; } })];

