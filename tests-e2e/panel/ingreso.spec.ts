/** Etapa 2 (docs/sistema-interno/09-ETAPAS.md): las pruebas de punta a punta del ingreso. */
import { expect, test, type Page } from "@playwright/test";
import { codigoNuevo, crearUsuaria, leer } from "./ayudas";

async function ingresar(page: Page) {
  const u = leer();
  await page.goto("/admin/ingresar");
  await page.getByLabel("Correo").fill(u.correo);
  await page.getByLabel("Contraseña").fill(u.clave);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/admin\/ingresar\/codigo/);
  await page.getByLabel("Código").fill(await codigoNuevo(u.secreto));
  await page.getByRole("button", { name: "Ingresar" }).click();
}

test("ingresar con contraseña y código lleva a /admin y muestra el nombre", async ({ page }) => {
  await ingresar(page);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: `Hola, ${leer().nombre}` })).toBeVisible();
});

test("contraseña mala muestra el mensaje y no entra", async ({ page }) => {
  await page.goto("/admin/ingresar");
  await page.getByLabel("Correo").fill(leer().correo);
  await page.getByLabel("Contraseña").fill("una-clave-que-no-es");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Correo o contraseña incorrectos." })).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/ingresar$/);
});

test("abrir /admin sin sesión lleva a /admin/ingresar", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/ingresar/);
  await expect(page.getByRole("heading", { name: "Ingresar al panel" })).toBeVisible();
});

test("«Salir» lleva a /admin/ingresar y volver atrás no muestra el panel", async ({ page }) => {
  await ingresar(page);
  await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/admin\/ingresar$/);
  await page.goBack();
  // Vuelve a /admin, Django responde 401 y la pantalla lleva otra vez al ingreso.
  await expect(page).toHaveURL(/\/admin\/ingresar/);
  await expect(page.getByRole("heading", { name: /^Hola,/ })).toHaveCount(0);
});

test("un usuario sin factor configurado termina en /admin/primer-ingreso", async ({ page }) => {
  const correo = `sin.factor.${Date.now()}@ejemplo.com`;
  const temporal = crearUsuaria(correo, "Sin Factor");
  await page.goto("/admin/ingresar");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña").fill(temporal);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/admin\/primer-ingreso$/);
  // Y aunque intente ir al inicio, vuelve a primer-ingreso.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/primer-ingreso$/);
});

test("la cookie de sesión no la ve JavaScript", async ({ page, context }) => {
  await ingresar(page);
  await expect(page).toHaveURL(/\/admin$/);
  const sesion = (await context.cookies()).find((c) => c.name.endsWith("elevar_panel"));
  expect(sesion?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("elevar_panel");
});
