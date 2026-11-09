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
  await Promise.all([
    page.waitForURL(/\/app\//),
    page.getByRole("button", { name: /Ingresar al sistema/ }).click(),
  ]);
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
  await page.getByRole("button", { name: "Programar servicio" }).click();
  await expect(page.getByRole("heading", { name: "Programar servicio" })).toBeVisible();
  await expect(page.getByLabel("Cotización aceptada")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();
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
  await page.getByRole("link", { name: "Reportes" }).click();
  await expect(page).toHaveURL(/\/app\/admin\/reportes$/);
  await expect(page.getByText("Planillas conciliadas")).toBeVisible();
  await expect(page.getByText("Conciliación de planillas")).toBeVisible();
  await capture(page, "admin-reportes-1366");
  await page.getByRole("link", { name: "Cuadrillas" }).click();
  await expect(page).toHaveURL(/\/app\/admin\/cuadrillas$/);
  await expect(page.getByRole("heading", { name: "Cuadrillas" })).toBeVisible();
  await expect(page.getByLabel("Activa")).toBeVisible();
  await capture(page, "admin-cuadrillas-1366");
  await page.getByRole("link", { name: "Trabajadores" }).click();
  await expect(page).toHaveURL(/\/app\/admin\/trabajadores$/);
  await expect(page.getByRole("heading", { name: "Trabajadores" })).toBeVisible();
  await expect(page.getByText("Ficha operativa persistente")).toBeVisible();
  await capture(page, "admin-trabajadores-1366");
  await page.getByRole("link", { name: "Catálogo de servicios" }).click();
  await expect(page).toHaveURL(/\/app\/admin\/servicios$/);
  await expect(page.getByRole("heading", { name: "Servicios DPM" })).toBeVisible();
  await expect(page.getByText(/Las unidades y tarifas son datos de desarrollo/)).toBeVisible();
  await capture(page, "admin-servicios-1366");
  await page.getByRole("link", { name: /Jornadas/ }).click();
  await expect(page).toHaveURL(/\/app\/admin\/jornadas$/);
  await expect(page.getByRole("heading", { name: /Jornadas y conciliación/ })).toBeVisible();
  await page.getByLabel("Inicio").fill("18:00");
  await page.getByLabel("Fin").fill("06:00");
  await expect(page.getByText(/Este turno cruza medianoche/)).toBeVisible();
  await capture(page, "admin-jornadas-1366");
});

test("admin puede recorrer el editor de cotizaciones por pasos", async ({ page }) => {
  await login(page, "admin");
  await page.goto("/app/admin/cotizaciones/nueva");
  await expect(page.getByRole("heading", { name: "Nueva cotización" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cliente y zona" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Visita técnica" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Conceptos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Costos internos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hitos y vigencia" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Revisión y envío" })).toBeVisible();

  const selects = page.locator("select");
  await selects.nth(0).selectOption({ index: 1 });
  await expect(selects.nth(1).locator("option")).toHaveCount(2);
  await selects.nth(1).selectOption({ index: 1 });
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Objeto de la cotización").fill("Mantenimiento de zona de prueba visual");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Valor unitario")).toBeVisible();
  await page.getByLabel("Concepto").fill("Mantenimiento manual");
  await page.getByLabel("Valor unitario").fill("250000");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText(/Información privada para administración/)).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Total de hitos: 100%")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Vista previa")).toBeVisible();
  await expect(page.getByText("Total al cliente")).toBeVisible();
  await capture(page, "admin-editor-cotizacion-1366");
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

test("operario puede reintentar si falla la carga de sus órdenes", async ({ page }) => {
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

test("operario inicia y finaliza una orden con persistencia de API", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "El flujo mutativo usa una orden de prueba y se ejecuta una vez por corrida.");
  await page.setViewportSize({ width: 360, height: 800 });
  await login(page, "operario");
  const pendingOrder = page.getByRole("button", { name: /Pendiente/ }).first();
  await expect(pendingOrder).toBeVisible();
  await pendingOrder.click();
  await expect(page.getByRole("button", { name: "Iniciar servicio" })).toBeVisible();
  await page.getByRole("button", { name: "Iniciar servicio" }).click();
  await expect(page.getByText("En ejecución")).toBeVisible();
  await page.getByLabel("Nota de finalización (opcional)").fill("Cierre registrado desde prueba de navegador");
  await page.getByRole("button", { name: "Finalizar servicio" }).click();
  await expect(page.getByRole("heading", { name: "Servicio finalizado" })).toBeVisible();
  await page.getByRole("button", { name: "Volver a mis órdenes" }).click();
  await expect(page).toHaveURL(/\/app\/operario\/ordenes$/);
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

test("informa y redirige cuando expira la sesión", async ({ page }) => {
  await login(page, "admin");
  await expect(page).toHaveURL(/\/app\/admin\/panel$/);
  await page.context().clearCookies();
  await page.goto("/app/admin/programacion");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("alert")).toContainText("Tu sesión expiró");
});
