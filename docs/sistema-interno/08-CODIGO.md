# 08 — Reglas de código

Lo que ya hace el código manda. Antes de escribir algo nuevo, mirá cómo está resuelto en el repo (las apps `leads` y `orders` del backend son el modelo) y hacelo igual. Si una regla de acá choca con el código, se para y se pregunta.

## Backend (`elevar-backend`)

### Estructura de la app `panel`

```
panel/
├── __init__.py
├── apps.py
├── models.py          # Perfil, IntentoIngreso, EventoAuditoria
├── permisos.py        # matriz rol × acción + clases de permiso de DRF (el único lugar que decide)
├── auditoria.py       # registrar(...) y la lista cerrada de acciones
├── sesion.py          # middleware de inactividad (30 min) y duración máxima (12 h)
├── ingreso.py         # servicio: contraseña, código, límites, primer ingreso
├── management/commands/ # crear_usuario_panel, baja_usuario_panel, reiniciar_segundo_factor_panel
├── services/          # un archivo por tema: consultas.py, ordenes.py, cursos.py, cuenta.py
├── serializers.py     # uno por caso de uso (lista, detalle, escritura)
├── views.py           # finas: validan, llaman al servicio, devuelven
├── urls.py            # todo bajo /api/v1/panel/
├── admin.py
└── migrations/
tests/panel/           # pruebas del panel (pytest)
```

Se registra en `INSTALLED_APPS` y en `config/urls.py` con `path("api/v1/panel/", include("panel.urls"))`.

### Nombres

| Qué | Cómo | Ejemplo |
|---|---|---|
| Modelos | Singular, en castellano en la app `panel` (las apps existentes están en inglés: no se renombran) | `EventoAuditoria`, `Perfil` |
| Campos | minúsculas con guion bajo | `segundo_factor_listo`, `created_at` |
| Servicios | verbo en castellano, argumentos por nombre | `cambiar_estado_consulta(*, actor, lead_id, estado, request)` |
| Serializers | `<Cosa><CasoDeUso>Serializer` | `ConsultaListaSerializer`, `ConsultaDetalleSerializer`, `ConsultaEstadoSerializer` |
| Vistas | `<Cosa><Acción>View` | `ConsultaListaView` |
| Rutas | sustantivos en castellano, plural | `/api/v1/panel/consultas/`, `/api/v1/panel/consultas/<id>/estado/` |
| Acciones de auditoría | `<entidad>.<verbo>` | `consulta.estado`, `orden.cumplida` |
| Códigos de error | MAYÚSCULAS, estables | `SESION_VENCIDA`, `SIN_PERMISO`, `TRANSICION_INVALIDA` |

### Cómo se escribe una acción del servidor

Todo cambio sigue estos pasos. Ejemplo: marcar una orden como cumplida.

```python
# panel/views.py — fina: valida, llama, responde
class OrdenCumplidaView(PanelView):                 # PanelView exige sesión + segundo factor + perfil activo
    permiso = "orden.cumplir"                        # se busca en la matriz de panel/permisos.py

    def post(self, request, public_id):
        datos = OrdenCumplidaSerializer(data=request.data)
        datos.is_valid(raise_exception=True)         # entrada validada; lo que sobra se rechaza
        orden = ordenes.marcar_cumplida(
            actor=request.user, public_id=public_id,
            nota=datos.validated_data.get("nota", ""), request=request,
        )
        return Response(OrdenDetalleSerializer(orden).data)
```

```python
# panel/services/ordenes.py — la regla de negocio, sin HTTP
from django.db import transaction
from django.utils import timezone

def marcar_cumplida(*, actor, public_id, nota, request):
    with transaction.atomic():
        cambiadas = Order.objects.filter(public_id=public_id, status="PAID").update(
            status="FULFILLED", fulfilled_at=timezone.now(),
        )
        if cambiadas == 0:
            if not Order.objects.filter(public_id=public_id).exists():
                raise NoEncontrado()                 # → 404
            raise TransicionInvalida()               # → 409: no estaba Pagada, o alguien ya la cumplió
        auditoria.registrar(actor=actor, accion="orden.cumplida", entidad="order",
                            entidad_id=str(public_id), detalle={"status": ["PAID", "FULFILLED"]},
                            request=request)         # en la misma transacción
    return Order.objects.get(public_id=public_id)
```

Reglas:
1. **La vista** no tiene lógica: valida con un serializer, llama a un servicio, devuelve. No toca la base directo.
2. **El permiso** lo resuelve `PanelView` + `panel/permisos.py` antes de entrar al método. Ninguna vista pregunta por el rol a mano.
3. **El servicio** recibe el `actor` (de la sesión), hace el cambio con condición dentro de `transaction.atomic()` y registra la auditoría en la misma transacción.
4. **Los errores** son excepciones de dominio que heredan de `core.exceptions.ElevarError` (con `code` y estado HTTP); el manejador que ya existe las convierte al formato de error común. Nunca se arma una respuesta de error a mano.
5. **Las listas** siempre acotadas, con la paginación que ya existe (`core/pagination.py`: 20 por defecto, `page_size` hasta 100 como máximo aunque se pida más). Las pantallas del panel piden `page_size=25`. Orden estable con el id como desempate; filtros validados contra una lista permitida.
6. **Las consultas** traen solo las columnas que se muestran (`.only()` o `.values()`); con relaciones, `select_related` / `prefetch_related` (nada de una consulta por fila).
7. **Plata** en `Decimal`; en el JSON viaja como texto (`"48000.00"`). **Fechas** con `timezone.now()`; en el JSON, ISO 8601 en UTC.
8. Toda acción nueva suma su caso a la prueba de permisos (`07-SEGURIDAD.md`, sección 5).

### Pruebas del backend

- `pytest` + `pytest-django`, en `tests/panel/`. Fábricas con `factory-boy` (ver `tests/factories.py`).
- Cada servicio: el caso feliz, el caso repetido (el mismo pedido dos veces no duplica nada) y el caso prohibido.
- Antes de escribir una prueba, la afirmación en castellano: «un usuario de Django sin perfil del panel que pide la lista de consultas recibe 403 y queda un `permiso.denegado`».
- Contra Postgres de verdad (el de `docker-compose.yml`), no una base simulada.

## Frontend (`elevar-web`)

### Estructura

```
app/admin/
├── layout.tsx                 # barra superior + menú; pide /api/panel/yo para saber quién es
├── ingresar/page.tsx
├── ingresar/codigo/page.tsx
├── primer-ingreso/page.tsx
├── page.tsx                   # inicio
├── consultas/page.tsx
├── consultas/[id]/page.tsx
└── …                          # una carpeta por pantalla de 05-PANTALLAS.md
app/api/panel/[...ruta]/route.ts   # puente hacia Django (decisión 1, 2026-11-17)
components/admin/              # piezas del panel (tabla, filtros, diálogos, estados)
lib/admin/
├── api.ts                     # cliente: un fetch por endpoint, tipado, maneja 401/403/404/429
├── tipos.ts                   # tipos que copian exactamente los serializers de Django
└── formato.ts                 # textos de estados y acciones en castellano
```

### Reglas

- **TypeScript estricto** (`strict: true` ya está). Nada de `any`: `unknown` y se acota.
- **Los tipos copian los serializers de Django** campo por campo. Si cambia un serializer, cambia el tipo en el mismo PR.
- **Plata:** llega como texto; para operar, `big.js`; para mostrar, los formateadores de `lib/formatters.ts`. Nunca `Number()` sobre plata.
- **Todo pedido de datos del panel pasa por `lib/admin/api.ts`**, con `credentials: "include"`, `cache: "no-store"` y el encabezado `X-CSRFToken` en las escrituras. Ningún componente hace `fetch` por su cuenta.
- **Respuestas:** 401 → a `/admin/ingresar?volver=<ruta>`; 403 → estado «sin permiso»; 404 → estado «no encontrado»; 429 → «Demasiados pedidos, esperá un momento»; 5xx o red → estado de error con «Reintentar».
- **Componentes de servidor por defecto;** `"use client"` solo en lo que lo necesita (formularios, filtros, diálogos). Las páginas del panel son dinámicas: nunca `use cache` ni `unstable_cache` con datos del panel.
- Componentes con nombre (`export function ConsultasTabla`), props con interfaz `<Componente>Props`.
- Solo clases y tokens de Tailwind del proyecto (`06-DISENO.md`); `style={}` solo para valores calculados.
- Los textos de estados («Nueva», «Pagada») salen de un solo lugar (`lib/admin/formato.ts`).
- Animaciones (GSAP, Framer Motion) solo en componentes de cliente, y en el panel solo para avisos cortos.

### Pruebas del frontend

- `pnpm lint` y la compilación sin errores (con el servidor de desarrollo apagado).
- Playwright (se agrega en la etapa 2): pruebas de punta a punta del ingreso y de cada pantalla con datos. Localizadores por rol y por texto (`getByRole`, `getByLabel`), afirmaciones que esperan solas (`await expect(...).toBeVisible()`), nunca esperas fijas. La sesión guardada de Playwright va en `playwright/.auth/`, que entra al `.gitignore` (tiene cookies).
- Antes de dar una pantalla por terminada, mirarla a 360, 375, 412, 1440 y 1920 px de ancho: nada cortado, nada superpuesto, los cuatro estados se ven, sin errores en la consola.

## Qué no se sube al repositorio

| Nunca | Por qué |
|---|---|
| `.env`, `.env.local`, `.env.*` (ya están en los `.gitignore`) | Secretos |
| `.env.example` (ni crearlo ni modificarlo) | Regla del dueño del proyecto |
| Claves, certificados, tokens, cadenas de conexión, contraseñas de prueba escritas en scripts | Ver `07-SEGURIDAD.md`, «Secretos» |
| Volcados de la base, exportaciones CSV con datos, capturas con datos reales | Datos personales |
| `playwright/.auth/` | Cookies de sesión |
| `node_modules/`, `.next/`, `.venv/`, `__pycache__/`, `staticfiles/`, `media/` | Se generan |

Antes de cada commit: `git diff --staged` leído entero, buscando claves y datos personales.
