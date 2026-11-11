/**
 * Mercado Pago Checkout Pro con la API de Orders (2026-11-04).
 * Recibe la orden de ELEVAR, crea la orden de pago en Mercado Pago y devuelve el link
 * de su página oficial (`checkout_url`). La clave secreta (MP_ACCESS_TOKEN) vive solo
 * en el servidor. Docs: mercadopago.com.mx/developers/en/docs/checkout-pro-orders
 */
import { NextResponse } from "next/server";

type Item = { title: string; unit_price: string; quantity: number };

const MAX_TITLE = 250;

export async function POST(req: Request) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Mercado Pago no está configurado." }, { status: 503 });

  let body: { publicId?: string; email?: string; dni?: string; total?: string; items?: Item[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const { publicId, email, dni, total, items } = body;
  if (!publicId || !/^[\w-]{6,64}$/.test(publicId) || !total || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Faltan datos de la orden." }, { status: 400 });
  }

  // Un solo renglón con el total: así el monto coincide siempre con lo que se ve en el
  // checkout, descuentos incluidos (la API exige total_amount = suma de los ítems).
  const amount = Number(total).toFixed(2);
  const detalle = items.map((i) => `${i.quantity}× ${i.title}`).join(" · ");
  const title = `ELEVAR · Orden ${publicId.slice(0, 8).toUpperCase()}`;

  // El DNI argentino (7 u 8 números) identifica al que paga; otro documento no se manda.
  const doc = typeof dni === "string" ? dni.replace(/\D/g, "") : "";
  const payer = email
    ? { email, ...(/^\d{7,8}$/.test(doc) ? { identification: { type: "DNI", number: doc } } : {}) }
    : null;

  const origin = new URL(req.url).origin;
  const vuelta = (status: string) => `${origin}/orden/${publicId}?status=${status}`;

  const res = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      type: "online",
      processing_mode: "manual",
      total_amount: amount,
      external_reference: publicId,
      description: detalle.slice(0, MAX_TITLE),
      ...(payer ? { payer } : {}),
      items: [{ title: title.slice(0, MAX_TITLE), unit_price: amount, quantity: 1 }],
      config: {
        online: {
          success_url: vuelta("success"),
          pending_url: vuelta("pending"),
          failure_url: vuelta("failure"),
          auto_return: "all",
        },
      },
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.checkout_url) {
    console.error("Mercado Pago /v1/orders", res.status, JSON.stringify(data));
    return NextResponse.json({ error: "No pudimos iniciar el pago con Mercado Pago." }, { status: 502 });
  }
  return NextResponse.json({ checkout_url: data.checkout_url, mp_order_id: data.id });
}
