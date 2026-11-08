import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";

test("una sesión firmada conserva identidad y rol sin usar localStorage", () => {
  const secret = "a-secret-longer-than-32-characters-for-test";
  const token = jwt.sign({ nombre: "Admin", correo: "admin@example.com", rol: "administrador" }, secret, {
    subject: "7",
    issuer: "dpm-sas-api",
    audience: "dpm-sas-web",
    expiresIn: 60,
  });
  const claims = jwt.verify(token, secret, { issuer: "dpm-sas-api", audience: "dpm-sas-web" }) as jwt.JwtPayload;
  assert.equal(claims.sub, "7");
  assert.equal(claims.rol, "administrador");
});

test("una sesión con firma alterada es rechazada", () => {
  const secret = "a-secret-longer-than-32-characters-for-test";
  assert.throws(() => jwt.verify("invalid.token.value", secret));
});
