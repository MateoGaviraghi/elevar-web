/** Etapas 3 a 7 (docs/sistema-interno/09-ETAPAS.md): las pruebas de punta a punta de cada pantalla. */
import { expect, test } from "@playwright/test";
import { codigoNuevo, datosDePrueba, guardar, ingresar, leer } from "./ayudas";

test("etapa 3 — filtrar por comunidad, marcar contactada y verla así en la lista", async ({ page }) => {
  const d = datosDePrueba();
  await ingresar(page);
  await page.getByRole("navigation", { name: "Menú del panel" }).getByRole("link", { name: "Consultas", exact: true }).click();
  await page.getByRole("button", { name: "Comunidad de WhatsApp" }).click();
  await expect(page).toHaveURL(/origen=COMUNIDAD/);
  await page.getByRole("row").filter({ hasText: d.consulta }).getByRole("link").click();
  await expect(page.getByRole("heading", { name: d.consulta })).toBeVisible();
  await page.getByRole("button", { name: "Marcar como contactada" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Marcar como contactada" }).click();
  await expect(page.getByText("Cambió el estado de una consulta")).toBeVisible();

  await page.goto("/admin/consultas?origen=COMUNIDAD&estado=CONTACTED");
  const fila = page.getByRole("row").filter({ hasText: d.consulta });
  await expect(fila.getByText("Contactada")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Comunidad de WhatsApp" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Contactada" })).toHaveAttribute("aria-pressed", "true");
});

test("etapa 5 — elegir un webinar muestra sus inscriptos y el cupo", async ({ page }) => {
  const d = datosDePrueba();
  await ingresar(page);
  await page.getByRole("navigation", { name: "Menú del panel" }).getByRole("link", { name: "Inscripciones", exact: true }).click();
  const selector = page.getByLabel("Webinar o curso en vivo");
  const valor = await selector.locator("option", { hasText: d.webinar }).getAttribute("value");
  await selector.selectOption(valor ?? "");
  await expect(page.getByRole("row")).toHaveCount(d.inscriptos + 1);
  await expect(page.getByText("80", { exact: true })).toBeVisible();
});

test("etapa 6 — agregar una fecha a un curso y verla en la ficha pública", async ({ page }) => {
  const d = datosDePrueba();
  await ingresar(page);
  await page.goto(`/admin/cursos/${d.curso_id}`);
  await page.getByRole("button", { name: "Agregar fecha" }).click();
  await page.getByLabel("Inicio").fill("2030-03-05T10:00");
  await page.getByLabel("Fin").fill("2030-03-05T13:00");
  await page.getByLabel("Cupo (vacío = sin límite)").fill("25");
  await page.getByRole("button", { name: "Guardar fecha" }).click();
  await expect(page.getByText("05/03/2030 10:00")).toBeVisible();

  await page.goto(`/cursos/${d.curso_slug}`);
  await expect(page.getByText("5 de marzo de 2030").first()).toBeVisible();
});

test("etapa 7 — marcar una orden como cumplida y verla con ese estado", async ({ page }) => {
  const d = datosDePrueba();
  await ingresar(page);
  await page.getByRole("navigation", { name: "Menú del panel" }).getByRole("link", { name: "Órdenes", exact: true }).click();
  await page.getByRole("row").filter({ hasText: d.orden.slice(0, 8) }).click();
  await expect(page.getByText("**.***.456")).toBeVisible();
  await page.getByRole("button", { name: "Marcar como cumplida" }).click();
  await expect(page.getByRole("dialog")).toContainText("¿Ya le diste acceso al aula virtual?");
  await page.getByRole("dialog").getByRole("button", { name: "Marcar como cumplida" }).click();
  await expect(page.getByText("Cumplida", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Marcar como cumplida" })).toHaveCount(0);
});

test("etapa 4 — ve su ingreso en la auditoría, cambia la contraseña y vuelve a entrar", async ({ page }) => {
  const u = leer();
  await ingresar(page);
  await page.getByRole("navigation", { name: "Menú del panel" }).getByRole("link", { name: "Auditoría", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Ingresó al panel" }).first()).toBeVisible();

  await page.getByRole("navigation", { name: "Menú del panel" }).getByRole("link", { name: "Mi cuenta", exact: true }).click();
  const nueva = `${u.clave}-nueva`;
  await page.getByLabel("Contraseña actual").fill(u.clave);
  await page.getByLabel("Contraseña nueva", { exact: true }).fill(nueva);
  await page.getByLabel("Repetí la contraseña nueva").fill(nueva);
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByRole("status")).toContainText("Contraseña cambiada");
  guardar({ ...u, clave: nueva });

  await page.getByRole("button", { name: "Salir" }).click();
  await page.getByLabel("Correo").fill(u.correo);
  await page.getByLabel("Contraseña").fill(nueva);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Código").fill(await codigoNuevo(u.secreto));
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("heading", { name: `Hola, ${u.nombre}` })).toBeVisible();
});
