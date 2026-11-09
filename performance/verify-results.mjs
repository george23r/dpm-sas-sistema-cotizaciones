import { readFile } from "node:fs/promises";

const file = process.argv[2]
  ? new URL(`../${process.argv[2].replaceAll("\\", "/")}`, import.meta.url)
  : new URL("./evidencia-2026-11-08/statistics.json", import.meta.url);
const report = JSON.parse(await readFile(file, "utf8"));
const expected = [
  { label: "GET cotizaciones", key: "GET cotizaciones" },
  { label: "GET historial servicios finalizados", key: "GET historial servicios finalizados" },
  { label: "GET reporte de periodo", key: "GET reporte de periodo" },
  // El JSON histÃ³rico conserva esta etiqueta con una codificaciÃ³n antigua; se valida por prefijo.
  { label: "GET comparaciÃ³n de planillas", key: Object.keys(report).find((name) => name.startsWith("GET compar")) },
];

for (const operation of expected) {
  const metric = operation.key ? report[operation.key] : undefined;
  if (!metric) throw new Error(`Falta la operaciÃ³n en el informe: ${operation.label}`);
  if (metric.sampleCount !== 500) throw new Error(`${operation.label}: se esperaban 500 muestras y hay ${metric.sampleCount}`);
  if (metric.errorCount !== 0) throw new Error(`${operation.label}: se encontraron ${metric.errorCount} errores`);
  if (metric.pct2ResTime >= 3000) throw new Error(`${operation.label}: P95 fuera del umbral (${metric.pct2ResTime} ms)`);
}

if (report.Total?.sampleCount !== 2010 || report.Total?.errorCount !== 0) {
  throw new Error("El total del informe no coincide con 10 logins + 2.000 consultas sin errores");
}

console.log(`PASS: ${expected.length} operaciones, 2.000 consultas, P95 < 3 s y 0 errores.`);

