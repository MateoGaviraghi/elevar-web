import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * Pruebas de punta a punta del panel (docs/sistema-interno/08-CODIGO.md, etapa 2).
 *
 * Levantan el backend local (elevar-backend, al lado de este repo o en ELEVAR_BACKEND_DIR) sobre
 * una base aparte, `elevar_e2e`, y `next dev` apuntando a él. Los usuarios de prueba se crean
 * con el comando crear_usuario_panel: datos inventados, nunca de producción.
 */
const BACKEND_DIR = process.env.ELEVAR_BACKEND_DIR ?? path.resolve(__dirname, "../elevar-backend");
const PUERTO_BACKEND = 8001;
const PUERTO_WEB = 3000;
const ENTORNO_BACKEND = `DB_PORT=${process.env.DB_PORT ?? "5434"} DB_NAME=elevar_e2e DJANGO_SETTINGS_MODULE=config.settings.development`;

export default defineConfig({
  testDir: "tests-e2e",
  fullyParallel: false,
  workers: 1, // el mismo código de la app no sirve dos veces: van de a una
  retries: 0,
  timeout: 90_000, // un ingreso puede esperar hasta 30 s a la próxima ventana del código
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PUERTO_WEB}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "preparar", testMatch: /preparar\.setup\.ts/ },
    { name: "panel", testMatch: /\.spec\.ts/, dependencies: ["preparar"], use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: `cd ${BACKEND_DIR} && ${ENTORNO_BACKEND} .venv/bin/python manage.py migrate --noinput && ${ENTORNO_BACKEND} .venv/bin/python manage.py runserver ${PUERTO_BACKEND} --noreload`,
      url: `http://localhost:${PUERTO_BACKEND}/api/v1/health/`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `PANEL_API_URL=http://localhost:${PUERTO_BACKEND} pnpm dev --port ${PUERTO_WEB}`,
      url: `http://localhost:${PUERTO_WEB}/admin/ingresar`,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
