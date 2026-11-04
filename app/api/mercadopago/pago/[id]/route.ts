/**
 * Confirma un pago de Mercado Pago al volver a /orden (2026-11-04): la dirección de vuelta
 * trae `payment_id` y `status`, pero el estado se toma de Mercado Pago, no de la URL.
 */
import { NextResponse } from "next/server";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Mercado Pago no está configurado." }, { status: 503 });

  const { id } = await props.params;
  if (!/^\d{1,30}$/.test(id)) return NextResponse.json({ error: "Pago inválido." }, { status: 400 });

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    console.error("Mercado Pago /v1/payments", res.status, JSON.stringify(data));
    return NextResponse.json({ error: "No pudimos consultar el pago." }, { status: 502 });
  }
  return NextResponse.json({
    status: data.status as string,
    external_reference: (data.external_reference ?? null) as string | null,
    date_approved: (data.date_approved ?? null) as string | null,
  });
}
