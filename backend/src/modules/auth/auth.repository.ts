import type { QueryResultRow } from "pg";
import { pool } from "../../db/pool.js";
import type { RolUsuario } from "../../shared/user-role.js";

interface UserRow extends QueryResultRow {
  id: number;
  nombre: string;
  correo: string;
  password_hash: string;
  rol: RolUsuario;
  activo: boolean;
}

export async function findActiveUserByEmail(email: string) {
  const result = await pool.query<UserRow>(
    `SELECT id, nombre, correo, password_hash, rol, activo
       FROM dpm.usuarios
      WHERE lower(correo) = lower($1)
        AND activo = true`,
    [email],
  );
  return result.rows[0];
}

export async function findActiveUserById(id: number) {
  const result = await pool.query<UserRow>(
    `SELECT id, nombre, correo, password_hash, rol, activo
       FROM dpm.usuarios
      WHERE id = $1 AND activo = true`,
    [id],
  );
  return result.rows[0];
}
