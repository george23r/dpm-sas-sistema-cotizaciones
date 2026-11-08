import { expect, test, type Page } from "@playwright/test";

const credentials = {
  admin: { correo: process.env.E2E_ADMIN_EMAIL ?? "admin@dpm.example", clave: process.env.E2E_ADMIN_PASSWORD ?? "Admin123!" },
  cliente: { correo: process.env.E2E_CLIENT_EMAIL ?? "hacienda@cliente.example", clave: process.env.E2E_CLIENT_PASSWORD ?? "Cliente123!" },
  operario: { correo: process.env.E2E_OPERATOR_EMAIL ?? "luis.gomez@dpm.example", clave: process.env.E2E_OPERATOR_PASSWORD ?? "Operario123!" },
};

async function login(page: Page, role: keyof typeof credentials) {
  await page.goto("/login");
  await page.getByRole("textbox").first().fill(credentials[role].correo);
  await page.getByRole("textbox").nth(1).fill(credentials[role].clave);
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
  await page.getByRole("link", { name: /Programaci/ }).click();
  await expect(page).toHaveURL(/\/app\/admin\/programacion$/);
  await expect(page.getByRole("button", { name: "Mes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Semana" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lista" })).toBeVisible();
  const monthTitle = page.getByRole("heading", { level: 2 }).first();
  const initialMonth = await monthTitle.textContent();
  await page.getByRole("button", { name: "Periodo siguiente" }).click();
  await expect(monthTitle).not.toHaveText(initialMonth ?? "");
  await capture(page, "admin-programacion-1366");
  await page.getByRole("button", { name: "Lista" }).click();
  const orderLink = page.getByRole("button", { name: /Ver orden/ }).first();
  await expect(orderLink).toBeVisible();
  await orderLink.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Asignar cuadrilla")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar detalle" }).click();
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

test("operario ve Ãºnicamente Ã³rdenes asignadas y portal mobile-first", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await login(page, "operario");
  await expect(page).toHaveURL(/\/app\/operario\/ordenes$/);
  await expect(page.getByRole("heading", { name: "Mis Ã³rdenes" })).toBeVisible();
  await expect(page.getByText("Servicios asignados a tu cuadrilla")).toBeVisible();
  await capture(page, "operario-ordenes-360");
  await page.goto("/app/admin/clientes");
  await expect(page).toHaveURL(/\/app\/operario\/ordenes$/);
});

test("operario puede reintentar si falla la carga de sus Ã³rdenes", async ({ page }) => {
  let firstRequest = true;
  await page.route("**/api/v1/ordenes/mias", async (route) => {
    if (firstRequest) {
      firstRequest = false;
      await route.abort("failed");
      return;
    }
    await route.continue();
  });
  await login(page, "operario");
  await expect(page.getByRole("alert")).toContainText("No fue posible actualizar");
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByText("Servicios asignados a tu cuadrilla")).toBeVisible();
});

test("permite recorrer el login con teclado", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/login");
  await page.getByRole("textbox").first().focus();
  await page.keyboard.type(credentials.operario.correo);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox").nth(1)).toBeFocused();
  await page.keyboard.type(credentials.operario.clave);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: /Ingresar al sistema/ })).toBeFocused();
  await expect(page.getByRole("button", { name: /Ingresar al sistema/ })).toBeVisible();
});

test("informa y redirige cuando expira la sesiÃ³n", async ({ page }) => {
  await login(page, "admin");
  await expect(page).toHaveURL(/\/app\/admin\/panel$/);
  await page.context().clearCookies();
  await page.getByRole("link", { name: /Programaci/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("alert")).toContainText("Tu sesiÃ³n expirÃ³");
});

