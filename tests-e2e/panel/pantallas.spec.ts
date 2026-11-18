/** Las pantallas de la etapa 2 a 360, 375, 412, 1440 y 1920 px (08-CODIGO): nada se sale de la
 * pantalla y no hay errores en la consola. Deja capturas en test-results/ para mirarlas. */
import { expect, test, type Page } from "@playwright/test";
import { codigoNuevo, leer } from "./ayudas";

const ANCHOS = [360, 375, 412, 1440, 1920];

function juntarErrores(page: Page): string[] {
  const errores: string[] = [];
  page.on("console", (m) => {
    // Los 401 de yo/ sin sesión son esperados (la pantalla lleva al ingreso).
    if (m.type() === "error" && !m.text().includes("401")) errores.push(m.text());
  });
  page.on("pageerror", (e) => errores.push(e.message));
  return errores;
}

async function revisar(page: Page, nombre: string, ancho: number) {
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(desborde, `${nombre} a ${ancho} px se sale de la pantalla`).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `test-results/pantallas/${nombre}-${ancho}.png`, fullPage: true });
}

test("ingreso y código en los cinco anchos", async ({ page }) => {
  const errores = juntarErrores(page);
  for (const ancho of ANCHOS) {
    await page.setViewportSize({ width: ancho, height: 800 });
    await page.goto("/admin/ingresar");
    await expect(page.getByRole("heading", { name: "Ingresar al panel" })).toBeVisible();
    await revisar(page, "ingresar", ancho);
    await page.goto("/admin/ingresar/codigo");
    await expect(page.getByRole("heading", { name: "Segundo paso" })).toBeVisible();
    await revisar(page, "codigo", ancho);
  }
  expect(errores).toEqual([]);
});

test("inicio del panel en los cinco anchos", async ({ page }) => {
  const errores = juntarErrores(page);
  const u = leer();
  await page.goto("/admin/ingresar");
  await page.getByLabel("Correo").fill(u.correo);
  await page.getByLabel("Contraseña").fill(u.clave);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Código").fill(await codigoNuevo(u.secreto));
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("heading", { name: /^Hola,/ })).toBeVisible();
  for (const ancho of ANCHOS) {
    await page.setViewportSize({ width: ancho, height: 800 });
    await page.goto("/admin");
    await expect(page.getByText("Todo al día.")).toBeVisible();
    await revisar(page, "inicio", ancho);
  }
  expect(errores).toEqual([]);
});
