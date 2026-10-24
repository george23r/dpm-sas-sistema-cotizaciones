import type { Cliente, Operario } from "../types/index.ts";

/** Reglas compartidas del prototipo. No equivalen a validaciones de servidor. */
export function validarCliente(
  input: Pick<Cliente,"nombre"|"correo"|"telefono">,
  existentes: Cliente[],
  idActual?: string
): string | null {
  const nombre=input.nombre.trim(),correo=input.correo.trim();
  if (nombre.length<3 || nombre.length>150) return "El nombre debe tener entre 3 y 150 caracteres.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return "El correo no tiene un formato válido.";
  if (!/^[+\d\s()-]{7,30}$/.test(input.telefono.trim())) return "Indica un teléfono válido.";
  if (existentes.some(c=>c.id!==idActual && c.nombre.trim().toLowerCase()===nombre.toLowerCase())) return "Ya existe un cliente con ese nombre.";
  if (existentes.some(c=>c.id!==idActual && c.correo.trim().toLowerCase()===correo.toLowerCase())) return "Ese correo ya está registrado.";
  return null;
}
export function validarOperario(
  input: Pick<Operario,"nombre"|"cuadrillaId"|"esLider">,
  existentes:Operario[],
  cuadrillasValidas:string[],
  idActual?:string
): string | null {
  const nombre=input.nombre.trim();
  if (nombre.length<3 || nombre.length>120) return "Escribe el nombre completo del trabajador.";
  if (!cuadrillasValidas.includes(input.cuadrillaId)) return "Selecciona una cuadrilla válida.";
  if (existentes.some(o=>o.id!==idActual&&o.nombre.trim().toLowerCase()===nombre.toLowerCase())) return "El trabajador ya está registrado.";
  if (input.esLider && existentes.some(o=>o.id!==idActual&&o.cuadrillaId===input.cuadrillaId&&o.esLider&&o.activo)) return "La cuadrilla ya tiene un líder activo.";
  return null;
}
