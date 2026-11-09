import AxeBuilder from "@axe-core/playwright";
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

async function expectAccessible(page: Page, name: string) {
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations, `${name}: se encontraron ${result.violations.length} violaciones Axe`).toEqual([]);
}

test("los tres portales pasan el smoke automatizado de accesibilidad", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "El smoke Axe se ejecuta una vez por corrida; Playwright cubre los motores por separado.");

  await page.setViewportSize({ width: 1366, height: 900 });
  await login(page, "admin");
  await expect(page).toHaveURL(/\/app\/admin\/panel$/);
  await expectAccessible(page, "portal administrador");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.setViewportSize({ width: 360, height: 800 });
  await login(page, "cliente");
  await expect(page).toHaveURL(/\/app\/cliente\/zonas$/);
  await expectAccessible(page, "portal cliente");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await login(page, "operario");
  await expect(page).toHaveURL(/\/app\/operario\/ordenes$/);
  await expectAccessible(page, "portal operario");
});
