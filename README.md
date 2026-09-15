# Elevar — Frontend (Next.js)

Sitio público, experiencia de compra de cursos y panel de administración de Elevar.
Corresponde a la parte **frontend** de la propuesta "Modernización Web y Carrito de
Compras" (AxisTech, agosto 2026).

> **Fase 0 — sin backend.** Todo funciona en el navegador: el catálogo, las
> promociones, las órdenes, los contactos y las inscripciones se guardan en
> `localStorage` a través de `lib/local-db.ts`. Las pantallas de Mercado Pago y
> PayPal son simulaciones para recorrer el flujo completo. `lib/api.ts` concentra
> todas las llamadas con firmas `async`: al conectar el backend se reemplaza su
> implementación sin tocar las pantallas.

## Puesta en marcha

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev            # http://localhost:3000
pnpm build && pnpm start
```

### Variables de entorno

| Variable | Para qué |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL del backend (Fase 1). |
| `NEXT_PUBLIC_WHATSAPP_COMUNIDAD_URL` | Enlace de invitación a la comunidad de WhatsApp. |
| `NEXT_PUBLIC_USD_RATE` | Cotización de referencia ARS→USD para mostrar precios de PayPal. |
| `NEXT_PUBLIC_PAYPAL_ENABLED` | `false` oculta PayPal del checkout si Elevar opera sólo con Mercado Pago. |

## Mapa de rutas

### Sitio público

| Ruta | Contenido |
| --- | --- |
| `/` | Home: hero, servicios, modalidades, promos vigentes, valores, clientes, contacto. |
| `/servicios`, `/servicios/[slug]` | Servicios y su detalle. |
| `/formacion`, `/formacion/[modality]` | Catálogo por modalidad (en vivo, asincrónicos, webinars, talleres). |
| `/cursos/[slug]` | Ficha del curso: fechas, cantidad de inscripciones, promos aplicables y compra. |
| `/promociones` | Descuentos automáticos y cupones vigentes. |
| `/blog`, `/blog/[slug]` | Cápsulas informativas. |
| `/nosotros`, `/contacto` | Institucional y formulario de consulta. |
| `/carrito` | Cantidades, participantes por inscripción, cupón y resumen con descuentos. |
| `/checkout` | Datos del comprador, correos de cada participante y medio de pago. |
| `/pago-mp/[publicId]`, `/pago-paypal/[publicId]` | Pasarelas simuladas (aprobado / rechazado / pendiente). |
| `/orden/[publicId]` | Estado de la operación con su detalle. |

### Panel de administración (`/admin`)

Login simple en `/admin/login` — demo: usuario `admin`, contraseña `elevar2026`.

| Ruta | Contenido |
| --- | --- |
| `/admin` | Indicadores de cursos, promociones, ventas y contactos. |
| `/admin/cursos` | CRUD de cursos: datos, precio, fechas/cupos, publicación. |
| `/admin/promociones` | CRUD de promociones automáticas y cupones. |
| `/admin/blog` | CRUD de notas con editor de bloques (párrafo, subtítulo, ítem). |
| `/admin/ordenes` | Órdenes, estados, participantes y cambio manual de estado. |
| `/admin/webinars` | Inscripciones a webinars, con exportación a CSV. |
| `/admin/contactos` | Contactos de formulario, comunidad, webinars y compras (CSV). |

## Cómo funcionan las piezas del alcance

- **Carrito con cantidades y participantes** (`lib/cart.ts`): cada línea lleva
  `quantity` y una lista de `attendees`; los correos se cargan en el carrito o en
  el checkout y viajan en la orden.
- **Promociones** (`lib/promos.ts`): `computePricing()` aplica todas las promos
  automáticas vigentes más, como máximo, un cupón, y devuelve el detalle de cada
  descuento para mostrarlo en carrito, checkout, pasarela y orden.
- **Medios de pago**: Mercado Pago en ARS y PayPal en USD (convertido con
  `NEXT_PUBLIC_USD_RATE`). El checkout también ofrece coordinar transferencia o
  factura a empresa por WhatsApp, por eso el teléfono es obligatorio.
- **Webinars**: la inscripción no pasa por el carrito; el formulario registra al
  participante y lo deja disponible en `/admin/webinars`.
- **Comunidad de WhatsApp**: botón en header, footer, menú mobile y burbuja fija;
  registra el contacto antes de entregar el enlace del grupo.
- **Newsletter**: dado de baja del sitio, según el alcance acordado.

## Estructura

```
app/(site)      Sitio público (header + footer + smooth scroll)
app/checkout    Checkout sin chrome del sitio
app/pago-*      Pasarelas simuladas
app/admin       Panel de administración
components/     UI por dominio (catalog, checkout, promos, admin, layout…)
lib/            Datos, carrito, promociones, API mock y store local
```

## Pendiente para Fase 1 (backend)

1. Reemplazar la implementación de `lib/api.ts` por llamadas HTTP reales.
2. Preferencias de Mercado Pago y órdenes de PayPal creadas en el servidor, con
   sus webhooks y los correos automáticos al comprador y al administrador.
3. Login del panel contra la API y protección de las rutas `/admin`.
4. Persistir cursos, promociones, blog, contactos e inscripciones en la base de
   datos (hoy viven en `localStorage`, por eso las ediciones del panel sólo se
   ven en el navegador donde se hicieron).
