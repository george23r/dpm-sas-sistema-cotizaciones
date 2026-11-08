import type { Request, Response } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { asyncRoute, HttpError } from "../../shared/errors.js";

const clienteIdSchema = z.coerce.number().int().positive();
const clientSchema = z.object({ nombre: z.string().trim().min(2).max(150), nit: z.string().trim().max(20).optional(), tipo: z.enum(["residencial", "comercial", "institucional", "agricola"]), telefono: z.string().trim().max(30).optional(), correoContacto: z.string().trim().email().max(160).optional() });
const zoneSchema = z.object({ clienteId: z.number().int().positive(), nombre: z.string().trim().min(2).max(120), direccion: z.string().trim().max(200).optional(), areaM2: z.number().positive().optional(), descripcion: z.string().trim().max(300).optional() });
const pathId = z.coerce.number().int().positive();

export const clientes = [authenticate, requireRole("administrador"), asyncRoute(async (_request: Request, response: Response) => {
  const result = await pool.query("SELECT id, nombre, nit, tipo, correo_contacto, telefono FROM dpm.clientes ORDER BY nombre");
  response.json({ data: result.rows });
})];

export const createClient = [authenticate, requireRole("administrador"), asyncRoute(async (request: Request, response: Response) => {
  const parsed = clientSchema.safeParse(request.body);
  if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Los datos del cliente no son válidos.", parsed.error.flatten().fieldErrors);
  try {
    const result = await pool.query(`INSERT INTO dpm.clientes (nombre,nit,tipo,telefono,correo_contacto) VALUES ($1,$2,$3,$4,$5) RETURNING id,nombre,nit,tipo,telefono,correo_contacto`, [parsed.data.nombre, parsed.data.nit ?? null, parsed.data.tipo, parsed.data.telefono ?? null, parsed.data.correoContacto ?? null]);
    response.status(201).json({ data: result.rows[0] });
  } catch (error) { if (error instanceof Error && /duplicate|unique/i.test(error.message)) throw new HttpError(409, "CLIENT_ALREADY_EXISTS", "Ya existe un cliente con ese nombre o NIT."); throw error; }
})];

export const updateClient = [authenticate, requireRole("administrador"), asyncRoute(async (request: Request, response: Response) => {
  const clientId = pathId.safeParse(request.params.id); const parsed = clientSchema.partial().safeParse(request.body);
  if (!clientId.success || !parsed.success || !Object.keys(parsed.data).length) throw new HttpError(422, "VALIDATION_ERROR", "Los datos del cliente no son válidos.");
  const fields: string[] = []; const values: unknown[] = [];
  const entries: Array<[string, unknown]> = [["nombre", parsed.data.nombre], ["nit", parsed.data.nit], ["tipo", parsed.data.tipo], ["telefono", parsed.data.telefono], ["correo_contacto", parsed.data.correoContacto]];
  for (const [column, value] of entries) if (value !== undefined) { fields.push(`${column}=$${values.push(value)}`); }
  values.push(clientId.data); try { const result = await pool.query(`UPDATE dpm.clientes SET ${fields.join(",")} WHERE id=$${values.length} RETURNING id,nombre,nit,tipo,telefono,correo_contacto`, values); if (!result.rows[0]) throw new HttpError(404, "CLIENT_NOT_FOUND", "El cliente no existe."); response.json({ data: result.rows[0] }); } catch (error) { if (error instanceof Error && /duplicate|unique/i.test(error.message)) throw new HttpError(409, "CLIENT_ALREADY_EXISTS", "Ya existe un cliente con ese nombre o NIT."); throw error; }
})];

export const zonas = [authenticate, asyncRoute(async (request: Request, response: Response) => {
  const parsed = request.query.clienteId === undefined ? { success: true as const, data: undefined } : clienteIdSchema.safeParse(request.query.clienteId);
  if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "El cliente no es válido.");
  const params: unknown[] = [];
  const where = parsed.data ? `WHERE z.cliente_id=$${params.push(parsed.data)}` : "";
  if (request.user?.rol === "cliente") {
    params.push(request.user.id);
    const clientClause = `z.cliente_id=(SELECT id FROM dpm.clientes WHERE usuario_id=$${params.length})`;
    const conjunction = where ? " AND " : "WHERE ";
    const result = await pool.query(`SELECT z.id,z.cliente_id,z.nombre,z.direccion,z.area_m2,z.descripcion FROM dpm.zonas z ${where}${conjunction}${clientClause} ORDER BY z.nombre`, params);
    response.json({ data: result.rows }); return;
  }
  const result = await pool.query(`SELECT z.id,z.cliente_id,z.nombre,z.direccion,z.area_m2,z.descripcion FROM dpm.zonas z ${where} ORDER BY z.nombre`, params);
  response.json({ data: result.rows });
})];

export const createZone = [authenticate, requireRole("administrador"), asyncRoute(async (request: Request, response: Response) => {
  const parsed = zoneSchema.safeParse(request.body); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Los datos de la zona no son válidos.", parsed.error.flatten().fieldErrors);
  try { const result = await pool.query(`INSERT INTO dpm.zonas (cliente_id,nombre,direccion,area_m2,descripcion) VALUES ($1,$2,$3,$4,$5) RETURNING id,cliente_id,nombre,direccion,area_m2,descripcion`, [parsed.data.clienteId, parsed.data.nombre, parsed.data.direccion ?? null, parsed.data.areaM2 ?? null, parsed.data.descripcion ?? null]); response.status(201).json({ data: result.rows[0] }); } catch (error) { if (error instanceof Error && /duplicate|unique/i.test(error.message)) throw new HttpError(409, "ZONE_ALREADY_EXISTS", "Ya existe una zona con ese nombre para el cliente."); throw error; }
})];

export const updateZone = [authenticate, requireRole("administrador"), asyncRoute(async (request: Request, response: Response) => {
  const zoneId = pathId.safeParse(request.params.id); const parsed = zoneSchema.omit({ clienteId: true }).partial().safeParse(request.body);
  if (!zoneId.success || !parsed.success || !Object.keys(parsed.data).length) throw new HttpError(422, "VALIDATION_ERROR", "Los datos de la zona no son válidos.");
  const fields: string[] = []; const values: unknown[] = []; const entries: Array<[string, unknown]> = [["nombre", parsed.data.nombre], ["direccion", parsed.data.direccion], ["area_m2", parsed.data.areaM2], ["descripcion", parsed.data.descripcion]];
  for (const [column, value] of entries) if (value !== undefined) { fields.push(`${column}=$${values.push(value)}`); }
  values.push(zoneId.data); try { const result = await pool.query(`UPDATE dpm.zonas SET ${fields.join(",")} WHERE id=$${values.length} RETURNING id,cliente_id,nombre,direccion,area_m2,descripcion`, values); if (!result.rows[0]) throw new HttpError(404, "ZONE_NOT_FOUND", "La zona no existe."); response.json({ data: result.rows[0] }); } catch (error) { if (error instanceof Error && /duplicate|unique/i.test(error.message)) throw new HttpError(409, "ZONE_ALREADY_EXISTS", "Ya existe una zona con ese nombre para el cliente."); throw error; }
})];

export const servicios = [authenticate, asyncRoute(async (_request: Request, response: Response) => {
  const result = await pool.query("SELECT id, nombre, unidad_cobro, activo FROM dpm.servicios WHERE activo=true ORDER BY id");
  response.json({ data: result.rows });
})];

export const operarios = [authenticate, requireRole("administrador"), asyncRoute(async (_request: Request, response: Response) => {
  const result = await pool.query(`SELECT o.id, o.nombre, o.cuadrilla_id, q.nombre AS cuadrilla, o.es_lider, o.activo,
    count(ot.id) FILTER (WHERE ot.estado <> 'finalizada' AND ot.inicio >= now())::int AS servicios_proximos
    FROM dpm.operarios o JOIN dpm.cuadrillas q ON q.id=o.cuadrilla_id
    LEFT JOIN dpm.ordenes_trabajo ot ON ot.cuadrilla_id=o.cuadrilla_id
    GROUP BY o.id, q.nombre ORDER BY o.nombre`);
  response.json({ data: result.rows });
})];
