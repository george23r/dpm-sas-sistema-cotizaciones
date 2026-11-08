import assert from "node:assert/strict";
import test from "node:test";
import { cn, formatCOP } from "../src/lib/utils.ts";

test("formatCOP representa pesos colombianos sin decimales", () => {
  assert.match(formatCOP(1250000), /1\.250\.000/);
});

test("formatCOP conserva valores cero", () => {
  assert.match(formatCOP(0), /0/);
});

test("cn combina clases y elimina conflictos de Tailwind", () => {
  assert.equal(cn("px-2", "px-4", undefined), "px-4");
});
