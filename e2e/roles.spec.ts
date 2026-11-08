import { expect, test, type Page } from "@playwright/test";

const credentials = {
  admin: { correo: process.env.E2E_ADMIN_EMAIL ?? "admin@dpm.example", clave: process.env.E2E_ADMIN_PASSWORD ?? "Admin123!" },
  cliente: { correo: process.env.E2E_CLIENT_EMAIL ?? "hacienda@cliente.example", clave: process.env.E2E_CLIENT_PASSWORD ?? "Cliente123!" },
  operario: { correo: process.env.E2E_OPERATOR_EMAIL ?? "luis.gomez@dpm.example", clave: process.env.E2E_OPERATOR_PASSWORD ?? "Operario123!" },
};

async function login(page: Page, role: keyof typeof credentials) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(credentials[role].correo);
  await page.getByLabel("Contraseña").fill(credentials[role].clave);
  await page.getByRole("button", { name: /Ingresar al sistema/ }).click();
}

async function capture(page: Page, name: string) {
  if (process.env.E2E_CAPTURE !== "1") return;
  await page.screenshot({ path: `evidencias/cross-browser-${test.info().project.name}-${name}.png`, fullPage: true });
}

test("administra el centro operativo y no depende del selector demo", async ({ page }) => {
  await login(page, "admin");
  await expect(page).toHaveURL(/\/app\/admin\/panel$/);
  await expect(page.getByRole("heading", { name: "Vista operativa" })).toBeVisible();
  await expect(page.getByText("Actividad temporal")).toBeVisible();
  await expect(page.getByText("Disponibilidad de cuadrillas")).toBeVisible();
  await capture(page, "admin-panel-1366");
  await page.getByRole("link", { name: "Programación" }).click();
  await expect(page).toHaveURL(/\/app\/admin\/programacion$/);
  await expect(page.getByRole("button", { name: "Mes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Semana" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lista" })).toBeVisible();
  await capture(page, "admin-programacion-1366");
  await page.getByRole("link", { name: "Cotizaciones" }).click();
  await expect(page).toHaveURL(/\/app\/admin\/cotizaciones$/);
  await page.getByRole("link", { name: "Ver detalle" }).first().click();
  await expect(page.getByText("Detalle de propuesta")).toBeVisible();
  await expect(page.getByText("Costos internos")).toBeVisible();
});

test("cliente solo entra a su portal y sus zonas", async ({ page }) => {
  await login(page, "cliente");
  await expect(page).toHaveURL(/\/app\/cliente\/zonas$/);
  await expect(page.getByRole("heading", { name: "Mis zonas verdes" })).toBeVisible();
  await capture(page, "cliente-zonas-360");
  await page.goto("/app/cliente/cotizaciones");
  await page.getByRole("link", { name: "Ver detalle" }).first().click();
  await expect(page.getByText("Detalle de propuesta")).toBeVisible();
  await expect(page.getByText("Costos internos")).not.toBeVisible();
  await page.goto("/app/admin/panel");
  await expect(page).toHaveURL(/\/app\/cliente\/zonas$/);
  await expect(page.getByText("Centro de operaciones")).not.toBeVisible();
});

test("operario ve únicamente órdenes asignadas y portal mobile-first", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await login(page, "operario");
  await expect(page).toHaveURL(/\/app\/operario\/ordenes$/);
  await expect(page.getByRole("heading", { name: "Mis órdenes" })).toBeVisible();
  await expect(page.getByText("Servicios asignados a tu cuadrilla")).toBeVisible();
  await capture(page, "operario-ordenes-360");
  await page.goto("/app/admin/clientes");
  await expect(page).toHaveURL(/\/app\/operario\/ordenes$/);
});
