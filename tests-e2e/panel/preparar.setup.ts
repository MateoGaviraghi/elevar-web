/**
 * Prepara la usuaria de prueba recorriendo el primer ingreso de verdad: entra con la contraseña
 * temporal del comando, escanea (lee la clave), confirma el primer código, cambia la contraseña y
 * recibe los 10 códigos de respaldo.
 */
import { expect, test as preparar } from "@playwright/test";
import { cargarDatosDePrueba, codigoNuevo, crearUsuaria, guardar } from "./ayudas";

preparar.setTimeout(120_000);

preparar("primer ingreso completo de la usuaria de prueba", async ({ page }) => {
  cargarDatosDePrueba();
  const correo = `laura.e2e.${Date.now()}@ejemplo.com`;
  const nombre = "Laura de Prueba";
  const temporal = crearUsuaria(correo, nombre);
  const clave = `clave-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // next dev compila cada pantalla la primera vez que se abre y recarga la pestaña: se abren
  // antes para que el recorrido no se corte a la mitad.
  for (const ruta of [
    "/admin", "/admin/primer-ingreso", "/admin/ingresar/codigo", "/admin/consultas", "/admin/consultas/1",
    "/admin/ordenes", "/admin/ordenes/00000000-0000-0000-0000-000000000000", "/admin/inscripciones",
    "/admin/cursos", "/admin/cursos/1", "/admin/auditoria", "/admin/cuenta", "/admin/ingresar",
  ]) {
    await page.goto(ruta);
    await page.waitForLoadState("networkidle");
  }
  await expect(page.getByRole("heading", { name: "Ingresar al panel" })).toBeVisible();
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Contraseña").fill(temporal);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page).toHaveURL(/\/admin\/primer-ingreso$/);
  await expect(page.getByRole("img", { name: "Código QR para la app autenticadora" })).toBeVisible();
  const secreto = (await page.locator("code").innerText()).trim();

  await page.getByLabel("Código de la app").fill(await codigoNuevo(secreto));
  await page.getByLabel("Contraseña nueva").fill(clave);
  await page.getByRole("button", { name: "Confirmar" }).click();

  await expect(page.getByRole("heading", { name: "Guardá tus códigos de respaldo" })).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(10);
  await page.getByRole("button", { name: "Ya los guardé" }).click();
  await expect(page.getByRole("heading", { name: `Hola, ${nombre}` })).toBeVisible();

  guardar({ correo, clave, secreto, nombre });
});
