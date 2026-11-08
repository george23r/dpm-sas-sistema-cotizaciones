import type { Request, Response } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { asyncRoute, HttpError } from "../../shared/errors.js";

const clienteIdSchema = z.coerce.number().int().positive();

export const clientes = [authenticate, requireRole("administrador"), asyncRoute(async (_request: Request, response: Response) => {
  const result = await pool.query("SELECT id, nombre, correo_contacto, telefono FROM dpm.clientes ORDER BY nombre");
  response.json({ data: result.rows });
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

export const servicios = [authenticate, asyncRoute(async (_request: Request, response: Response) => {
  const result = await pool.query("SELECT id, nombre, unidad_cobro, activo FROM dpm.servicios WHERE activo=true ORDER BY id");
  response.json({ data: result.rows });
})];
